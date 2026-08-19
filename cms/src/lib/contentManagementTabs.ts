import { COLLECTION_LABELS, DRAFT_ENABLED_COLLECTIONS } from "@/lib/collectionLabels";

/**
 * RFP feedback 5.9 — "content management sayfası tab'li haliyle kalsın … ama
 * hiçbir user burada bir edit vs yapamasın, sadece temiz bir rapor sayfası
 * olsun, ne collectionumuz var ve onun altında ne değerlerimiz var şeklinde
 * tüm collection'ların özet sayfası olsun … olmayan gereken table'ları
 * ekleyelim."
 *
 * Two changes from the previous shape:
 *
 * 1. It's a REPORT. Every create/edit/delete affordance is gone; rows link out
 *    to Payload's own document view, where the real per-collection access
 *    rules already apply. Nothing here can mutate anything.
 *
 * 2. It covers the whole CMS, not the 7 collections the tabs started with. All
 *    22 appear in the summary table; 20 also get a detail tab. The two without
 *    a tab, and why:
 *      - `audit-logs`: an append-only security log with its own screen, its own
 *        CSV export and its own per-role read scoping. A row-by-row copy here
 *        would duplicate that screen and bury the content it's meant to report
 *        on. Its totals still appear in the summary.
 *      - `translations`: admin UI microcopy keyed by string id (`key`/`tr`/`en`)
 *        — infrastructure for the panel itself, not site content anyone would
 *        audit from a content report. Totals appear in the summary.
 *
 * Access is NOT re-implemented: every request goes through Payload's REST API
 * with the browser's session cookie, no `overrideAccess`. A collection this
 * role can't read simply reports as inaccessible instead of leaking a count.
 */

export type ReportColumn = {
  /** Field name on the document, or "_status" for the draft/published badge. */
  key: string;
  label: { tr: string; en: string };
  type?: "text" | "date" | "bool" | "status" | "relation";
  /**
   * Display text for a `select` field's raw stored values. Without this the
   * report prints the database value ("pending", "expired") straight at the
   * reader, which is neither Turkish nor English.
   */
  values?: Record<string, { tr: string; en: string }>;
};

export type ReportCollection = {
  slug: string;
  /** Field used as the row's primary label. */
  titleField: string;
  hasDraft: boolean;
  /** Populate relationships when the columns need a human-readable value. */
  depth?: number;
  /** Shown in the detail tab. Keep to what's meaningful for THIS collection — a single title/status/updated template across 20 different shapes tells you nothing. */
  columns: ReportColumn[];
};

const UPDATED: ReportColumn = { key: "updatedAt", label: { tr: "Güncellendi", en: "Updated" }, type: "date" };
const STATUS: ReportColumn = { key: "_status", label: { tr: "Durum", en: "Status" }, type: "status" };
const ORDER: ReportColumn = { key: "order", label: { tr: "Sıra", en: "Order" } };
const PAGE: ReportColumn = { key: "page", label: { tr: "Sayfa", en: "Page" } };

export const REPORT_COLLECTIONS: ReportCollection[] = [
  {
    slug: "campaigns",
    titleField: "title",
    hasDraft: true,
    depth: 1,
    columns: [
      { key: "category", label: { tr: "Kategori", en: "Category" }, type: "relation" },
      STATUS,
      {
        key: "reviewStatus",
        label: { tr: "İnceleme", en: "Review" },
        values: {
          pending: { tr: "İncelemede", en: "Pending" },
          rejected: { tr: "Reddedildi", en: "Rejected" },
        },
      },
      { key: "featured", label: { tr: "Öne Çıkan", en: "Featured" }, type: "bool" },
      { key: "endDate", label: { tr: "Bitiş", en: "End" }, type: "date" },
      UPDATED,
    ],
  },
  {
    slug: "categories",
    titleField: "label",
    hasDraft: false,
    columns: [{ key: "slug", label: { tr: "URL Adı", en: "URL Name" } }, ORDER, UPDATED],
  },
  {
    slug: "blog-posts",
    titleField: "title",
    hasDraft: true,
    columns: [
      { key: "slug", label: { tr: "URL Adı", en: "URL Name" } },
      { key: "publishedDate", label: { tr: "Yayın Tarihi", en: "Published" }, type: "date" },
      STATUS,
      UPDATED,
    ],
  },
  {
    slug: "faq-items",
    titleField: "question",
    hasDraft: true,
    columns: [{ key: "category", label: { tr: "Kategori", en: "Category" } }, ORDER, STATUS, UPDATED],
  },
  {
    slug: "announcements",
    titleField: "title",
    hasDraft: true,
    columns: [{ key: "deeplink", label: { tr: "Bağlantı", en: "Link" } }, ORDER, STATUS, UPDATED],
  },
  {
    slug: "content-blocks",
    titleField: "title",
    hasDraft: true,
    columns: [
      PAGE,
      {
        key: "blockType",
        label: { tr: "Blok Tipi", en: "Block Type" },
        values: {
          step: { tr: "Adım", en: "Step" },
          slide: { tr: "Slayt", en: "Slide" },
          video: { tr: "Video", en: "Video" },
          logo: { tr: "Logo", en: "Logo" },
        },
      },
      ORDER,
      STATUS,
      UPDATED,
    ],
  },
  {
    slug: "pages",
    titleField: "title",
    hasDraft: true,
    columns: [{ key: "slug", label: { tr: "URL Adı", en: "URL Name" } }, STATUS, UPDATED],
  },
  {
    slug: "representatives",
    titleField: "businessName",
    hasDraft: false,
    columns: [
      { key: "province", label: { tr: "İl", en: "Province" } },
      { key: "district", label: { tr: "İlçe", en: "District" } },
      { key: "repCode", label: { tr: "Temsilci Kodu", en: "Rep Code" } },
      UPDATED,
    ],
  },
  {
    slug: "product-heroes",
    titleField: "heading",
    hasDraft: true,
    columns: [PAGE, STATUS, UPDATED],
  },
  {
    slug: "feature-cards",
    titleField: "title",
    hasDraft: true,
    columns: [PAGE, ORDER, STATUS, UPDATED],
  },
  {
    slug: "step-cards",
    titleField: "text",
    hasDraft: true,
    columns: [PAGE, { key: "number", label: { tr: "Adım", en: "Step" } }, ORDER, STATUS, UPDATED],
  },
  {
    slug: "fee-rows",
    titleField: "label",
    hasDraft: true,
    columns: [{ key: "value", label: { tr: "Değer", en: "Value" } }, ORDER, STATUS, UPDATED],
  },
  {
    slug: "limit-tables",
    titleField: "title",
    hasDraft: true,
    columns: [ORDER, STATUS, UPDATED],
  },
  {
    slug: "nav-links",
    titleField: "label",
    hasDraft: true,
    columns: [
      { key: "href", label: { tr: "Adres", en: "Href" } },
      { key: "section", label: { tr: "Bölüm", en: "Section" } },
      ORDER,
      STATUS,
      UPDATED,
    ],
  },
  {
    slug: "legal-pages",
    titleField: "title",
    hasDraft: true,
    columns: [{ key: "slug", label: { tr: "URL Adı", en: "URL Name" } }, STATUS, UPDATED],
  },
  {
    slug: "cookie-rows",
    titleField: "name",
    hasDraft: true,
    columns: [
      { key: "provider", label: { tr: "Sağlayıcı", en: "Provider" } },
      { key: "category", label: { tr: "Kategori", en: "Category" } },
      { key: "duration", label: { tr: "Süre", en: "Duration" } },
      STATUS,
      UPDATED,
    ],
  },
  {
    slug: "page-meta",
    titleField: "pageKey",
    hasDraft: true,
    columns: [
      { key: "breadcrumbLabel", label: { tr: "Breadcrumb", en: "Breadcrumb" } },
      { key: "seoTitle", label: { tr: "SEO Başlığı", en: "SEO Title" } },
      STATUS,
      UPDATED,
    ],
  },
  {
    slug: "media",
    titleField: "filename",
    hasDraft: false,
    depth: 1,
    columns: [
      {
        key: "mediaType",
        label: { tr: "Tür", en: "Type" },
        values: { image: { tr: "Görsel", en: "Image" }, video: { tr: "Video", en: "Video" } },
      },
      { key: "alt", label: { tr: "Alt Metin", en: "Alt Text" } },
      { key: "uploadedBy", label: { tr: "Yükleyen", en: "Uploaded By" }, type: "relation" },
      UPDATED,
    ],
  },
  {
    slug: "documents",
    titleField: "filename",
    hasDraft: false,
    columns: [{ key: "mimeType", label: { tr: "Dosya Tipi", en: "File Type" } }, UPDATED],
  },
  {
    slug: "users",
    titleField: "email",
    hasDraft: false,
    columns: [
      { key: "role", label: { tr: "Rol", en: "Role" } },
      { key: "lastLoginAt", label: { tr: "Son Giriş", en: "Last Login" }, type: "date" },
      { key: "lockUntil", label: { tr: "Kilitli (bitiş)", en: "Locked Until" }, type: "date" },
    ],
  },
];

/** Every collection the summary table reports on — the 20 above plus the two that don't get a detail tab. */
export const SUMMARY_ONLY_COLLECTIONS = ["audit-logs", "translations"];

export const ALL_REPORTED_SLUGS = [...REPORT_COLLECTIONS.map((c) => c.slug), ...SUMMARY_ONLY_COLLECTIONS];

export function hasDrafts(slug: string): boolean {
  return DRAFT_ENABLED_COLLECTIONS.has(slug);
}

export function tabLabel(slug: string, locale: "tr" | "en"): string {
  if (slug === SITE_ROUTES_TAB_SLUG) return locale === "tr" ? "Site Sayfaları (geliştirici yapımı)" : "Site Pages (developer-built)";
  return COLLECTION_LABELS[slug]?.[locale] ?? slug;
}

/**
 * RFP follow-up: "sistemde kaç tane page varsa ... hangi page var görebilecğimiz
 * bir liste de lazım". The `pages` tab above already lists every editor-built
 * Pages document — but roughly 20 of the site's routes (the homepage, product
 * pages like /vodafone-pay-uygulama, legal pages, etc.) are hand-written
 * `src/app/*\/page.tsx` files, not Payload documents, so no API call can ever
 * list them. This is a hand-maintained reference table, not a live query —
 * update it when a route is added/removed/renamed under src/app. Kept here
 * (not fetched) rather than skipped, because "no list exists for these" was
 * the actual gap being reported, not "list only what the API can see".
 */
export const SITE_ROUTES_TAB_SLUG = "site-routes";

export type SiteRoute = {
  path: string;
  title: string;
  /** Where this route is (or isn't) linked from today — helps answer "is this reachable at all". */
  linkedFrom: { tr: string; en: string };
};

export const HAND_BUILT_ROUTES: SiteRoute[] = [
  { path: "/", title: "Anasayfa", linkedFrom: { tr: "Logo", en: "Logo" } },
  { path: "/vodafone-pay-uygulama", title: "Vodafone Pay Uygulaması", linkedFrom: { tr: "Header → Ürünler", en: "Header → Products" } },
  { path: "/vodafone-pay-kart", title: "Vodafone Pay Kart", linkedFrom: { tr: "Header → Ürünler", en: "Header → Products" } },
  { path: "/qr-ile-faturana-yansit", title: "QR ile Faturana Yansıt", linkedFrom: { tr: "Header → Ürünler", en: "Header → Products" } },
  { path: "/faturana-yansit", title: "Faturana Yansıt", linkedFrom: { tr: "Header → Ürünler", en: "Header → Products" } },
  { path: "/aninda-bakiye", title: "Anında Bakiye", linkedFrom: { tr: "Header → Ürünler", en: "Header → Products" } },
  { path: "/kampanyalar", title: "Kampanyalar", linkedFrom: { tr: "Header → Ana Menü", en: "Header → Main menu" } },
  { path: "/blog", title: "Blog", linkedFrom: { tr: "Header → Ana Menü", en: "Header → Main menu" } },
  { path: "/ucretler-ve-limitler", title: "Ücretler ve Limitler", linkedFrom: { tr: "Header → Ana Menü", en: "Header → Main menu" } },
  { path: "/sikca-sorulan-sorular", title: "Sıkça Sorulan Sorular", linkedFrom: { tr: "Header → Ana Menü, Footer → Sık Sorulanlar", en: "Header → Main menu, Footer → FAQ" } },
  { path: "/temsilciliklerimiz", title: "Temsilciliklerimiz", linkedFrom: { tr: "Footer → Kurumsal", en: "Footer → Corporate" } },
  { path: "/iletisim", title: "İletişim", linkedFrom: { tr: "Footer → Kurumsal", en: "Footer → Corporate" } },
  { path: "/kurumsal-yonetim", title: "Kurumsal Yönetim", linkedFrom: { tr: "Footer → Kurumsal", en: "Footer → Corporate" } },
  { path: "/duyurular", title: "Duyurular", linkedFrom: { tr: "Footer → Kurumsal", en: "Footer → Corporate" } },
  { path: "/site-haritasi", title: "Site Haritası", linkedFrom: { tr: "Footer → Yasal", en: "Footer → Legal" } },
  { path: "/gizlilik-ve-guvenlik-politikasi", title: "Gizlilik ve Güvenlik Politikası", linkedFrom: { tr: "Footer → Yasal", en: "Footer → Legal" } },
  { path: "/cerez-politikasi", title: "Çerez Politikası", linkedFrom: { tr: "Footer → Yasal", en: "Footer → Legal" } },
  { path: "/bilgi-guvenligi", title: "Bilgi Güvenliği", linkedFrom: { tr: "Footer → Yasal", en: "Footer → Legal" } },
  { path: "/sozlesmeler-ve-formlar", title: "Sözleşmeler ve Formlar", linkedFrom: { tr: "Footer → Yasal", en: "Footer → Legal" } },
  { path: "/web-sitesi-hukum-ve-sartlari", title: "Web Sitesi Kullanımı Hüküm ve Şartları", linkedFrom: { tr: "Footer → Yasal", en: "Footer → Legal" } },
  { path: "/faydali-bilgiler", title: "Faydalı Bilgiler", linkedFrom: { tr: "Footer → Yasal", en: "Footer → Legal" } },
];
