import type { Access, CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig, Where } from "payload";
import { revalidateCampaignPaths, revalidateCampaignPathsOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete, writeAuditLog } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { campaignsCreate, campaignsReadWrite, denyMakerPublish, isNewVerticalMaker, ROLES } from "@/access/roles";
import { sitePreviewUrl } from "@/lib/preview";
import { dbLabel } from "@/lib/collectionLabels";

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
    // "Yerel hafızaya kopyala" is Payload's copy-to-locale tool (copies
    // field values between locales) — Campaigns has no localized fields,
    // so it did nothing useful here.
    disableCopyToLocale: true,
    // RFP feedback: the detail page's big hero image made a single-campaign
    // preview look "too large"; the full /kampanyalar list page (tried next)
    // showed unrelated featured cards + header/nav noise. What an editor
    // actually wants is just THIS card, exactly as it'll render on the real
    // listing page — see kampanyalar/[slug]/kart-onizleme/page.tsx.
    preview: (doc) => (typeof doc.slug === "string" ? sitePreviewUrl(`/kampanyalar/${doc.slug}/kart-onizleme`) : null),
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "campaigns" } }],
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
      admin: {
        description: "Kampanyanın ait olduğu kategori. Listede yoksa sol menüden 'Categories'e gidip yeni bir tane ekleyebilirsiniz.",
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
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [setCreatedBy, manageReviewCycle, denyMakerPublish],
    afterChange: [revalidateCampaignPaths, auditAfterChange("campaigns"), auditRejection],
    afterDelete: [revalidateCampaignPathsOnDelete, auditAfterDelete("campaigns")],
  },
};
