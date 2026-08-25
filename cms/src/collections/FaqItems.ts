import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { dbLabel } from "@/lib/collectionLabels";
import { assignFooterOrder, assignNextOrder, FOOTER_ORDER_FIELD_DESCRIPTION, FOOTER_ORDER_MAX, ORDER_FIELD_DESCRIPTION } from "@/hooks/ordering";
import { CATEGORY_SCOPES } from "@/collections/Categories";

/**
 * Separate from `assignNextOrder` (hooks/ordering.ts) because that helper
 * always reads/writes a field literally named `order` — `homepageOrder`
 * needed its own small version rather than a generalization neither other
 * caller needs yet. Only assigns when the question is actually flagged for
 * the homepage; nothing to number otherwise.
 */
const assignNextHomepageOrder: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Runs on create AND update — an editor can check "Anasayfada Göster" on
  // an existing question later, not only set it at creation time, and that
  // moment needs a homepageOrder just as much as a brand-new one does.
  if (!data?.showOnHomepage) return data;
  if (typeof data.homepageOrder === "number" && data.homepageOrder > 0) return data;

  try {
    const { docs } = await req.payload.find({
      collection: "faq-items",
      where: { showOnHomepage: { equals: true } },
      sort: "-homepageOrder",
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const highest = (docs[0] as { homepageOrder?: number } | undefined)?.homepageOrder;
    data.homepageOrder = typeof highest === "number" ? highest + 1 : 1;
  } catch (err) {
    console.error("[ordering] failed to compute next homepageOrder:", err);
    data.homepageOrder = 1;
  }
  return data;
};

export const FaqItems: CollectionConfig = {
  slug: "faq-items",
  labels: {
    singular: dbLabel("collectionLabel.faq-items.singular", { tr: "Sık Sorulan Soru", en: "FAQ Item" }),
    plural: dbLabel("collectionLabel.faq-items.plural", { tr: "Sık Sorulanlar", en: "FAQ Items" }),
  },
  // RFP follow-up: was `defaultSort: "order"` (RFP feedback 5.5) — that's
  // still exactly right for the SITE (getFaqItems sorts by `order`, unchanged),
  // but for the ADMIN LIST it meant a newly-created question could land
  // anywhere in a long "order" sequence instead of being easy to find right
  // after creating it. Admin list now shows newest-first; the site's own
  // visitor-facing order is untouched — see `order`'s own field comment.
  defaultSort: "-createdAt",
  admin: {
    hideAPIURL: true,
    useAsTitle: "question",
    defaultColumns: ["question", "category", "showOnHomepage", "order", "createdAt", "_status"],
    group: { tr: "İçerik Yönetimi", en: "Content Management" },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "faq-items" } },
        {
          path: "/components/ReorderWidget#default",
          clientProps: {
            collection: "faq-items",
            groupField: "category",
            // Group list (with per-category counts) comes from the server,
            // including categories with 0 or 1 question — see ReorderWidget's
            // `groupsFrom` doc comment for why this replaced the old
            // fetch-all-200-then-group-client-side approach.
            groupsFrom: { collection: "categories", where: { scope: { equals: CATEGORY_SCOPES.FAQ } } },
          },
        },
      ],
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    { name: "question", type: "text", required: true },
    { name: "answer", type: "textarea", required: true },
    {
      // RFP §3.1.7: "Each content item should have a deeplink field in
      // order to enable redirection." An FAQ answer is often "see the full
      // details here" — rendered as an optional link under the answer text
      // in the shared Faq.tsx accordion component on the site.
      name: "deeplink",
      type: "text",
      label: { tr: "İlgili Bağlantı", en: "Related Link" },
      admin: {
        description: {
          tr: "Opsiyonel — cevabın altında gösterilecek ilgili bir sayfa bağlantısı, örn: /vodafone-pay-kart",
          en: "Optional — a related page link shown below the answer, e.g. /vodafone-pay-kart",
        },
      },
    },
    {
      // Was a hardcoded `select` (fixed option list baked into code, same
      // problem Campaigns/BlogPosts.category had before their own
      // Categories migration — RFP feedback 1.3). Every product page fetches
      // its FAQ block by category slug (see src/app/*/page.tsx's
      // `getFaqItems("<slug>")` calls on the site) and the SSS page's tabs
      // are keyed off the same slugs, so adding a category here (Kategoriler
      // → Oluştur) is what makes both the product page's FAQ block and a new
      // /sikca-sorulan-sorular?kategori=<slug> tab exist — no code change,
      // no developer needed.
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      // Categories is shared with Campaigns/BlogPosts now — `scope` keeps
      // this picker from also offering their (unrelated) categories. See
      // Categories.ts for why this has to be a separate list at all.
      filterOptions: () => ({ scope: { equals: CATEGORY_SCOPES.FAQ } }),
      admin: {
        description: {
          tr: "Bu sorunun hangi ürün sayfasında ve /sikca-sorulan-sorular sekmesinde görüneceğini belirler (SSS akışındaki kategoriler). Listede yoksa Kategoriler'e gidip 'Akış: Sık Sorulan Sorular' ile yeni bir tane oluşturun.",
          en: "Determines which product page and /sikca-sorulan-sorular tab this question shows on (categories in the FAQ flow). If it's not in the list, go to Categories and create one with 'Flow: FAQ'.",
        },
      },
    },
    {
      // RFP follow-up: the homepage's own SSS block used to just be
      // `getFaqItems("anasayfa")` — "show on homepage" and "category" were
      // the same signal, so a question couldn't belong to a real product
      // category (e.g. "Anında Bakiye") AND appear on the homepage too.
      // This is a second, independent signal on top of `category`, not a
      // replacement for it — the existing "Anasayfa" category stays exactly
      // what it is (its own tab on /sikca-sorulan-sorular), this just adds
      // "...and also show it on /".
      name: "showOnHomepage",
      type: "checkbox",
      defaultValue: false,
      label: { tr: "Anasayfada Göster", en: "Show on Homepage" },
      admin: {
        description: {
          tr: "İşaretlenirse bu soru, kendi kategorisine ek olarak anasayfadaki SSS bloğunda da görünür.",
          en: "If checked, this question also appears in the homepage's FAQ block, in addition to its own category.",
        },
      },
    },
    {
      // Independent from `order` on purpose: `order` is scoped per-category
      // (assignNextOrder below), so two homepage-flagged questions from
      // different categories could both be "order: 1" — meaningless for
      // deciding which comes first on the homepage. Only relevant, and only
      // shown, when showOnHomepage is checked.
      name: "homepageOrder",
      type: "number",
      label: { tr: "Anasayfa Sırası", en: "Homepage Order" },
      min: 1,
      admin: {
        condition: (data) => Boolean(data?.showOnHomepage),
        description: {
          tr: "Anasayfadaki SSS bloğunda gösterim sırası. Boş bırakılırsa otomatik olarak sona eklenir.",
          en: "Position within the homepage FAQ block. Leave empty to append to the end automatically.",
        },
        // RFP follow-up (§3.1): live "N kayıt var, önerilen sıra: M" line
        // under the input, recomputed as `showOnHomepage` is toggled. Purely
        // informational — see LiveOrderField.tsx's doc comment for why it
        // never auto-fills the value itself.
        components: {
          Field: {
            path: "/components/LiveOrderField#default",
            clientProps: { collection: "faq-items", watchPath: "showOnHomepage", mode: "boolean" },
          },
        },
      },
    },
    {
      name: "order",
      type: "number",
      label: { tr: "Sıra", en: "Order" },
      // Deliberately NO defaultValue. Payload populates defaults BEFORE
      // beforeChange runs, so a `defaultValue: 1` here arrives at
      // assignNextOrder looking exactly like a number the editor typed —
      // the hook's "respect an explicit value" guard then bails out and the
      // auto-numbering never happens. Caught live: a new FAQ in a category
      // whose highest order was 12 was still being saved as 1. Leaving this
      // empty is also the honest UI, and matches the field description:
      // blank means "put it at the end", which is what the hook then does.
      min: 1,
      admin: {
        description: ORDER_FIELD_DESCRIPTION,
        components: {
          Field: {
            path: "/components/LiveOrderField#default",
            clientProps: { collection: "faq-items", watchPath: "category", mode: "relationship" },
          },
        },
      },
    },
    {
      // RFP follow-up: footer'daki "Sık Sorulanlar" sütunu artık sabit
      // kod/NavLinks değil, buradan yönetiliyor — işaretlenen sorular (en
      // fazla FOOTER_ORDER_MAX tanesi) footer'da gösteriliyor.
      name: "showInFooter",
      type: "checkbox",
      defaultValue: false,
      label: { tr: "Footer'da Göster", en: "Show in Footer" },
      admin: {
        description: {
          tr: "İşaretlenirse bu soru, sitenin her sayfasındaki footer'ın 'Sık Sorulanlar' sütununda görünür.",
          en: "If checked, this question appears in the footer's 'Sık Sorulanlar' column on every page of the site.",
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
        condition: (data) => Boolean(data?.showInFooter),
        description: FOOTER_ORDER_FIELD_DESCRIPTION,
        components: {
          Field: {
            path: "/components/FooterOrderField#default",
            clientProps: { collection: "faq-items", watchPath: "showInFooter", max: FOOTER_ORDER_MAX },
          },
        },
      },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("faq-items", ["category"]), assignNextHomepageOrder, assignFooterOrder("faq-items")],
    afterChange: [revalidateTag("faq-items"), auditAfterChange("faq-items")],
    afterDelete: [revalidateTagOnDelete("faq-items"), auditAfterDelete("faq-items")],
  },
};
