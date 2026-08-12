/**
 * Short display labels for content collections, shared between the
 * dashboard widgets and (in the future) any other admin surface that needs
 * a human-readable name for a collection slug. Kept separate from
 * `helpContent.ts` because that file's titles are paired with long
 * how-to steps; this is just the label.
 */

export const COLLECTION_LABELS: Record<string, { tr: string; en: string }> = {
  campaigns: { tr: "Kampanyalar", en: "Campaigns" },
  "faq-items": { tr: "Sık Sorulanlar", en: "FAQ Items" },
  "blog-posts": { tr: "Blog Yazıları", en: "Blog Posts" },
  announcements: { tr: "Duyurular", en: "Announcements" },
  "content-blocks": { tr: "İçerik Blokları", en: "Content Blocks" },
  representatives: { tr: "Temsilciler", en: "Representatives" },
  pages: { tr: "Sayfalar", en: "Pages" },
  "fee-rows": { tr: "Ücret Tablosu", en: "Fee Rows" },
  "limit-tables": { tr: "Limit Tabloları", en: "Limit Tables" },
  "nav-links": { tr: "Menü Linkleri", en: "Nav Links" },
  "legal-pages": { tr: "Hukuki Sayfalar", en: "Legal Pages" },
  "cookie-rows": { tr: "Çerez Satırları", en: "Cookie Rows" },
  "page-meta": { tr: "Sayfa Meta Bilgileri", en: "Page Meta" },
  "product-heroes": { tr: "Ürün Hero Alanları", en: "Product Heroes" },
  "feature-cards": { tr: "Özellik Kartları", en: "Feature Cards" },
  "step-cards": { tr: "Adım Kartları", en: "Step Cards" },
  media: { tr: "Medya", en: "Media" },
  documents: { tr: "Dokümanlar", en: "Documents" },
};

/** Collections with `versions.drafts: true` — these can be split published/taslak. Everything else is a flat total. */
export const DRAFT_ENABLED_COLLECTIONS = new Set([
  "campaigns",
  "faq-items",
  "blog-posts",
  "announcements",
  "content-blocks",
  "pages",
  "fee-rows",
  "limit-tables",
  "nav-links",
  "legal-pages",
  "cookie-rows",
  "page-meta",
  "product-heroes",
  "feature-cards",
  "step-cards",
]);

/** New Vertical roles see every content collection; Growth roles only ever touch Campaigns. */
export const NEW_VERTICAL_DASHBOARD_COLLECTIONS = [
  "campaigns",
  "faq-items",
  "blog-posts",
  "announcements",
  "content-blocks",
  "representatives",
  "pages",
  "fee-rows",
  "limit-tables",
  "nav-links",
  "legal-pages",
  "cookie-rows",
  "page-meta",
  "product-heroes",
  "feature-cards",
  "step-cards",
  "media",
  "documents",
];

export const GROWTH_DASHBOARD_COLLECTIONS = ["campaigns"];
