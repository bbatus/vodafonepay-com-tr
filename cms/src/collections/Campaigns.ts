import { APIError } from "payload";
import type { Access, CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig, Where } from "payload";
import { revalidateCampaignPaths, revalidateCampaignPathsOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete, writeAuditLog } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { campaignsCreate, campaignsReadWrite, denyMakerPublish, isNewVerticalMaker, ROLES } from "@/access/roles";
import { sitePreviewUrl } from "@/lib/preview";
import { dbLabel } from "@/lib/collectionLabels";
import { CATEGORY_SCOPES } from "@/collections/Categories";
import { assignFooterOrder, FOOTER_ORDER_FIELD_DESCRIPTION, FOOTER_ORDER_MAX } from "@/hooks/ordering";

/**
 * Growth Maker can never publish its own campaigns (denyMakerPublish), but
 * until now it also couldn't delete a mistakenly-created one — the only
 * escape hatch was asking a New Vertical Maker to clean it up by hand.
 * Scoped narrowly: own campaigns only (via `createdBy`, set below), and
 * only while still a draft — once a Checker publishes it, deletion reverts
 * to New Vertical Maker only, same as every other collection.
 */
const campaignsDelete: Access = (args) => {
  if (isNewVerticalMaker(args)) return true;
  const role = (args.req.user as { role?: string } | undefined)?.role;
  if (role === ROLES.GROWTH_MAKER && args.req.user?.id) {
    const where: Where = {
      and: [{ _status: { equals: "draft" } }, { createdBy: { equals: args.req.user.id } }],
    };
    return where;
  }
  return false;
};

const setCreatedBy: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === "create" && req.user?.id) {
    data.createdBy = req.user.id;
  }
  return data;
};

/**
 * RFP feedback 3.11: a Growth Maker editing (resubmitting) a draft that was
 * previously rejected should automatically go back to "pending" review —
 * no manual "clear rejection" step. Only fires for the maker's own edits;
 * the reviewer's own reject action (which explicitly sets these fields on
 * the same request) is unaffected since this only resets a doc that was
 * ALREADY rejected before this request started.
 */
const manageReviewCycle: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  const role = (req.user as { role?: string } | undefined)?.role;
  if (operation === "update" && role === ROLES.GROWTH_MAKER && originalDoc?.reviewStatus === "rejected") {
    data.reviewStatus = "pending";
    data.rejectionReason = null;
    data.rejectedAt = null;
    data.rejectedBy = null;
  }
  return data;
};

/**
 * RFP feedback 5.4 — "yayında bir kampanya edit edilmeye çalışılıyorsa önce
 * durumu pasife çekilmeli gibi bir path vermeliyiz … pasife çekilme onayı
 * verilirse ilgili düzenleme yapılabilir. ama ilk düzenlendiği tarih neydiyse
 * orada kalmalı".
 *
 * "Pasife çekme" is Payload's own unpublish (`_status: draft`), NOT the
 * `campaignStatus` active/expired field. The two mean different things and
 * conflating them would break the other one: `campaignStatus: "expired"` means
 * "this campaign is over" and drops it off the site's listing pages for good
 * (see getCampaigns() in the site's lib/cms.ts), which is not what "I want to
 * fix a typo" should do. `_status: draft` already means "not live, editable,
 * goes back through review" — the exact semantics asked for — and it plugs
 * straight into the reviewStatus/RoleAwarePublishButton machinery that already
 * exists rather than growing a second, parallel approval system.
 *
 * `createdAt` is untouched by any of this: Payload only ever writes it on
 * insert, so an unpublish → edit → republish cycle keeps the campaign in its
 * original position under `defaultSort: "-createdAt"` (and under the site's
 * own `sort=-createdAt`). Verified live — see the round report.
 *
 * Fields that may still change while a document is published: the request
 * metadata itself, the review fields, and `_status`. Anything else is content,
 * and content edits are what this blocks.
 */
const EDITABLE_WHILE_PUBLISHED = new Set([
  "_status",
  "unpublishRequest",
  "unpublishRequestedBy",
  "unpublishRequestedAt",
  "reviewStatus",
  "rejectionReason",
  "rejectedAt",
  "rejectedBy",
  "updatedAt",
  "createdAt",
  "id",
]);

/** Roles that may take a campaign off the air themselves; everyone else has to request it. */
const CAN_UNPUBLISH = new Set<string>([ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_CHECKER]);

export const guardPublishedEdit: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (operation !== "update" || originalDoc?._status !== "published") return data;

  const role = (req.user as { role?: string } | undefined)?.role;
  const isEnglish = req.i18n?.language === "en";
  const goingToDraft = data?._status === "draft";

  if (goingToDraft) {
    if (!role || !CAN_UNPUBLISH.has(role)) {
      throw new APIError(
        isEnglish
          ? "You can't take a published campaign off the air yourself — request it and a Checker will approve."
          : "Yayındaki bir kampanyayı kendiniz yayından kaldıramazsınız — talep oluşturun, bir Checker onaylasın.",
        403,
        undefined,
        true
      );
    }
    // Unpublishing puts it back into the normal review cycle and clears the
    // request that asked for it.
    data.unpublishRequest = "none";
    data.unpublishRequestedBy = null;
    data.unpublishRequestedAt = null;
    data.reviewStatus = "pending";
    return data;
  }

  const changedContentField = Object.keys(data ?? {}).some(
    (key) => !EDITABLE_WHILE_PUBLISHED.has(key) && JSON.stringify(data[key]) !== JSON.stringify(originalDoc[key])
  );
  if (!changedContentField) return data;

  throw new APIError(
    isEnglish
      ? "This campaign is live and can't be edited directly. Take it off the air first (Unpublish), make your changes, then send it back through review. Its original creation date — and its position in the list — are preserved."
      : "Bu kampanya yayında olduğu için doğrudan düzenlenemez. Önce yayından kaldırın, değişikliklerinizi yapın, sonra tekrar onaya gönderin. Kampanyanın ilk oluşturulma tarihi — dolayısıyla listedeki sırası — korunur.",
    409,
    undefined,
    true
  );
};

/** RFP feedback 3.11: distinct audit-log entry so Waiting Approvals can count rejections. */
const auditRejection: CollectionAfterChangeHook = async ({ req, doc, previousDoc, operation }) => {
  if (operation === "update" && !previousDoc?.rejectionReason && doc?.rejectionReason) {
    await writeAuditLog(req, {
      action: "rejected",
      collectionSlug: "campaigns",
      documentId: String(doc.id),
      summary: `campaigns: "${doc.title ?? doc.id}" reddedildi — ${doc.rejectionReason}`,
    });
  }
  return doc;
};

export const Campaigns: CollectionConfig = {
  slug: "campaigns",
  labels: {
    singular: dbLabel("collectionLabel.campaigns.singular", { tr: "Kampanya", en: "Campaign" }),
    plural: dbLabel("collectionLabel.campaigns.plural", { tr: "Kampanyalar", en: "Campaigns" }),
  },
  // RFP feedback 2.6: "Çoğalt" (Duplicate) was the source of a real bug —
  // it generated a new doc with an invalid slug (spaces/uppercase, e.g.
  // "...- Copy"), which failed silently before the slug validation added
  // for 1.2 started catching it. Removed rather than fixed: it has no real
  // use for this content team.
  disableDuplicate: true,
  // RFP feedback: liste en son oluşturulan kampanya en üstte olacak şekilde sıralanmalı.
  defaultSort: "-createdAt",
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["title", "category", "featured", "startDate", "endDate", "_status"],
    group: { tr: "İçerik", en: "Content" },
    // "Yerel hafızaya kopyala" is Payload's copy-to-locale tool (copies field
    // values between locales) — it did nothing useful here even before
    // content localization was switched off entirely (RFP feedback 5.7). Kept
    // set so re-enabling `localization` later can't quietly bring it back
    // without someone deciding this collection wants it.
    disableCopyToLocale: true,
    // RFP feedback: the detail page's big hero image made a single-campaign
    // preview look "too large"; the full /kampanyalar list page (tried next)
    // showed unrelated featured cards + header/nav noise. What an editor
    // actually wants is just THIS card, exactly as it'll render on the real
    // listing page — see kampanyalar/[slug]/kart-onizleme/page.tsx.
    preview: (doc) => (typeof doc.slug === "string" ? sitePreviewUrl(`/kampanyalar/${doc.slug}/kart-onizleme`) : null),
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "campaigns" } },
        // RFP feedback 5.11: full-column CSV export, Turkish-Excel safe.
        "/components/CampaignsExportButton#default",
      ],
      edit: {
        PublishButton: "/components/RoleAwarePublishButton#default",
        SaveDraftButton: "/components/SaveOrSubmitButton#default",
      },
    },
  },
  versions: {
    // RFP feedback: "Taslağı Kaydet" was silently accepting drafts with
    // missing required fields (title/slug/description/image/category) —
    // Payload's default is to skip field validation on draft saves.
    // `validate: true` enforces the same required-field rules on drafts
    // that already apply on publish.
    drafts: { validate: true },
  },
  access: {
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: campaignsCreate,
    update: campaignsReadWrite,
    delete: campaignsDelete,
  },
  fields: [
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      admin: { hidden: true },
    },
    {
      // RFP feedback 3.11: a real reject action (not just "leave as draft
      // forever") so Waiting Approvals can report approved/reddedilen/toplam
      // counts. Growth Maker resubmitting an edit auto-resets this to
      // "pending" — see manageReviewCycle above.
      name: "reviewStatus",
      type: "select",
      label: "İnceleme Durumu",
      defaultValue: "pending",
      options: [
        { label: "İncelemede", value: "pending" },
        { label: "Reddedildi", value: "rejected" },
      ],
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "rejectionReason",
      type: "textarea",
      label: "Red Sebebi",
      admin: {
        position: "sidebar",
        description: "Checker reddederse sebep burada görünür. Taslağı tekrar kaydettiğinizde otomatik temizlenir.",
        condition: (data) => data?.reviewStatus === "rejected",
      },
      access: {
        update: ({ req }) => (req.user as { role?: string } | undefined)?.role !== ROLES.GROWTH_MAKER,
      },
    },
    {
      name: "rejectedAt",
      type: "date",
      label: "Reddedilme Tarihi",
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
        condition: (data) => data?.reviewStatus === "rejected",
      },
    },
    {
      name: "rejectedBy",
      type: "relationship",
      relationTo: "users",
      label: "Reddeden",
      admin: { position: "sidebar", readOnly: true, condition: (data) => data?.reviewStatus === "rejected" },
    },
    {
      // RFP feedback 5.4: a Growth Maker can't unpublish, so this is how it
      // asks. A Checker seeing "pending" here is the approval step.
      name: "unpublishRequest",
      type: "select",
      label: { tr: "Yayından Kaldırma Talebi", en: "Unpublish Request" },
      defaultValue: "none",
      options: [
        { label: { tr: "Yok", en: "None" }, value: "none" },
        { label: { tr: "Onay bekliyor", en: "Awaiting approval" }, value: "pending" },
      ],
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.unpublishRequest === "pending" || data?._status === "published",
        description: {
          tr: "Yayındaki bir kampanya doğrudan düzenlenemez. Maker talep oluşturur, Checker onaylayıp yayından kaldırır; düzenleme ondan sonra açılır.",
          en: "A live campaign can't be edited directly. A Maker requests, a Checker approves and unpublishes; editing opens after that.",
        },
      },
    },
    {
      name: "unpublishRequestedBy",
      type: "relationship",
      relationTo: "users",
      label: { tr: "Talebi Açan", en: "Requested By" },
      admin: { position: "sidebar", readOnly: true, condition: (data) => data?.unpublishRequest === "pending" },
    },
    {
      name: "unpublishRequestedAt",
      type: "date",
      label: { tr: "Talep Tarihi", en: "Requested At" },
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
        condition: (data) => data?.unpublishRequest === "pending",
      },
    },
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      label: "URL Adı (slug)",
      admin: {
        description:
          "Kampanyanın site adresini belirler: /kampanyalar/{slug}. Sadece küçük harf, rakam ve tire (-) kullanın — boşluk ve Türkçe karakter (ç,ğ,ı,ö,ş,ü) OLMAZ. Örnek: yaz-kampanyasi-2026",
      },
      validate: (value: unknown) => {
        if (typeof value !== "string" || value.length === 0) return "Zorunlu alan";
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
          return "Sadece küçük harf, rakam ve tire (-) kullanabilirsiniz — boşluk, büyük harf veya Türkçe karakter olmaz. Örnek: yaz-kampanyasi-2026";
        }
        return true;
      },
    },
    { name: "description", type: "textarea", required: true },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "body", type: "richText", admin: { description: "Detay sayfasının gövde metni" } },
    { name: "terms", type: "richText", admin: { description: "Katılım koşulları / kampanya esasları" } },
    {
      // RFP feedback 1.3: was a hardcoded `select` (4 fixed options baked
      // into code, business couldn't add/rename one). Now a real,
      // business-editable collection — see collections/Categories.ts.
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      // Categories is shared with FaqItems now — `scope` keeps the two
      // pickers from offering each other's options (see Categories.ts).
      filterOptions: () => ({ scope: { equals: CATEGORY_SCOPES.CAMPAIGN } }),
      admin: {
        description:
          "Kampanyanın ait olduğu kategori (Kampanyalar/Blog akışındaki kategoriler). Listede yoksa sol menüden Kategoriler'e gidip 'Akış: Kampanyalar ve Blog' ile yeni bir tane ekleyebilirsiniz.",
      },
    },
    {
      // Named campaignStatus (not "status") to avoid colliding with
      // Payload's own internal draft/published `_status` versioning field —
      // both generate a Postgres enum keyed off the field name, and
      // "status" collided with it (confirmed live: CREATE TABLE failed with
      // "invalid input value for enum enum_campaigns_status: active").
      name: "campaignStatus",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Aktif", value: "active" },
        { label: "Süresi doldu", value: "expired" },
      ],
      admin: { description: "Süresi dolan kampanya liste sayfalarından kalkar, detay sayfası erişilebilir kalır" },
    },
    { name: "featured", type: "checkbox", defaultValue: false, label: "Bu ayın favorilerinde göster" },
    {
      name: "ctaLabel",
      type: "text",
      defaultValue: "Detayları gör",
      label: "Buton Yazısı",
      admin: { description: "Kampanya kartındaki butonun üzerinde yazacak metin. Örnek: Detayları Gör, Hemen Katıl" },
    },
    {
      name: "ctaUrl",
      type: "text",
      label: "Buton Linki",
      admin: {
        description:
          "Butona tıklandığında gidilecek adres. Boş bırakılırsa buton bu kampanyanın kendi detay sayfasına (/kampanyalar/{slug}) götürür — çoğu kampanya için boş bırakmanız yeterlidir.",
      },
    },
    {
      name: "seoTitle",
      type: "text",
      label: "SEO Başlığı",
      admin: {
        description:
          "Google arama sonuçlarında ve link paylaşımlarında görünecek başlık. Boş bırakılırsa yukarıdaki 'Title' alanı kullanılır.",
      },
    },
    {
      name: "seoDescription",
      type: "textarea",
      label: "SEO Açıklaması",
      admin: {
        description:
          "Google arama sonuçlarında başlığın altında görünecek kısa açıklama (1-2 cümle). Boş bırakılırsa yukarıdaki 'Description' alanı kullanılır.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "startDate",
          type: "date",
          label: "Başlangıç Tarihi (opsiyonel)",
          admin: {
            date: { pickerAppearance: "dayOnly" },
            description: "İkisi de opsiyoneldir — boş bırakılırsa kampanya süresiz görünür.",
          },
        },
        {
          name: "endDate",
          type: "date",
          label: "Bitiş Tarihi (opsiyonel)",
          admin: {
            date: { pickerAppearance: "dayOnly" },
            description: "Bu tarih geçince kampanya liste sayfalarından otomatik kalkar (detay sayfası erişilebilir kalır).",
          },
        },
      ],
    },
    {
      // RFP follow-up: footer'daki "Kampanyalar" sütunu artık sabit
      // kod/NavLinks değil, buradan yönetiliyor — işaretlenen kampanyalar
      // (en fazla FOOTER_ORDER_MAX tanesi) footer'da gösteriliyor.
      name: "showInFooter",
      type: "checkbox",
      defaultValue: false,
      label: { tr: "Footer'da Göster", en: "Show in Footer" },
      admin: {
        position: "sidebar",
        description: {
          tr: "İşaretlenirse bu kampanya, sitenin her sayfasındaki footer'ın 'Kampanyalar' sütununda görünür.",
          en: "If checked, this campaign appears in the footer's 'Kampanyalar' column on every page of the site.",
        },
      },
    },
    {
      name: "footerOrder",
      type: "number",
      label: { tr: "Footer Sırası", en: "Footer Order" },
      min: 1,
      max: FOOTER_ORDER_MAX,
      admin: {
        position: "sidebar",
        condition: (data) => Boolean(data?.showInFooter),
        description: FOOTER_ORDER_FIELD_DESCRIPTION,
        components: {
          Field: {
            path: "/components/LiveOrderField#default",
            clientProps: { collection: "campaigns", watchPath: "showInFooter", mode: "boolean" },
          },
        },
      },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [setCreatedBy, manageReviewCycle, guardPublishedEdit, denyMakerPublish, assignFooterOrder("campaigns")],
    afterChange: [revalidateCampaignPaths, auditAfterChange("campaigns"), auditRejection],
    afterDelete: [revalidateCampaignPathsOnDelete, auditAfterDelete("campaigns")],
  },
};
