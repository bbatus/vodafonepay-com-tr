import type { LabelFunction, Payload } from "payload";

/**
 * Short display labels for content collections, shared between the
 * dashboard widgets and (in the future) any other admin surface that needs
 * a human-readable name for a collection slug. Kept separate from
 * `helpContent.ts` because that file's titles are paired with long
 * how-to steps; this is just the label.
 */

export const COLLECTION_LABELS: Record<string, { tr: string; en: string }> = {
  campaigns: { tr: "Kampanyalar", en: "Campaigns" },
  categories: { tr: "Kategoriler", en: "Categories" },
  users: { tr: "Kullanıcılar", en: "Users" },
  "audit-logs": { tr: "Denetim Kayıtları", en: "Audit Logs" },
  translations: { tr: "Çeviriler", en: "Translations" },
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
  media: { tr: "Medya", en: "Media" },
  documents: { tr: "Dokümanlar", en: "Documents" },
  "contact-info": { tr: "İletişim Bilgileri", en: "Contact Info" },
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
  // Follow-up 28.08: Growth's expanded scope needed the same maker/checker
  // draft→published gate these three didn't have before (see
  // Categories.ts/Representatives.ts/Documents.ts and
  // scripts/growth-role-migration-28-08.sql).
  "categories",
  "representatives",
  "documents",
]);

/**
 * Every content collection either department's maker/checker pair can
 * touch. Used to be New-Vertical-only with Growth fenced to `["campaigns"]`
 * — follow-up 28.08 (business decision): Growth Maker/Checker now mirror
 * New Vertical's own content scope exactly, so both dashboard constants
 * below are intentionally identical. Kept as two separate exports (rather
 * than one alias) so a future divergence between the two departments'
 * dashboards is a one-line change, not a refactor.
 */
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
  "media",
  "documents",
  "categories",
];

export const GROWTH_DASHBOARD_COLLECTIONS = [...NEW_VERTICAL_DASHBOARD_COLLECTIONS];

/**
 * RFP feedback: 21 of 22 collections had no `labels` at all — Payload falls
 * back to title-casing the English slug ("Faq Items", "Blog Posts"), which
 * doesn't change when the admin switches to English (it was already
 * English) and never was Turkish either. `admin.group` had the opposite
 * problem: a hardcoded Turkish string that never changed. Both are fixed
 * the same way — every collection's `labels.singular`/`labels.plural` reads
 * from this DB-backed cache via `dbLabel()`, and `admin.group` gets a
 * plain locale-keyed Record (Payload's `StaticLabel` type — no live DB read
 * needed there, `admin.group` doesn't accept a function per
 * node_modules/payload/dist/collections/config/types.d.ts).
 *
 * The cache is populated once at boot (`refreshLabelCache`, called from
 * payload.config.ts's `onInit`, same place `translations` gets seeded) and
 * refreshed whenever an editor changes a Translations row (see
 * Translations.ts's `afterChange` hook) — so an edited label shows up on
 * the next page load, no redeploy needed. If the cache is empty (DB not
 * seeded yet, or the read failed), `dbLabel` falls back to the hardcoded
 * value passed in at each call site — the sidebar never renders blank.
 */
let labelCache: Record<string, { tr: string; en: string }> | null = null;

export async function refreshLabelCache(payload: Payload): Promise<void> {
  try {
    const rows = await payload.find({
      collection: "translations",
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    });
    const map: Record<string, { tr: string; en: string }> = {};
    for (const row of rows.docs as unknown as { key: string; tr: string; en: string }[]) {
      map[row.key] = { tr: row.tr, en: row.en };
    }
    labelCache = map;
  } catch (err) {
    // Best-effort — collection labels just keep using their hardcoded
    // fallback if this fails; it must never block boot or a request.
    console.error("[collectionLabels] failed to refresh label cache:", err);
  }
}

/**
 * Builds a Payload `LabelFunction` for `labels.singular`/`labels.plural`.
 * `key` is a `translations` collection row key (e.g. "collectionLabel.campaigns.plural") —
 * add it to `translationDefaults.ts` so it's seeded and editable like any
 * other admin string; `fallback` is used until the cache is populated or if
 * the key doesn't exist yet.
 */
export function dbLabel(key: string, fallback: { tr: string; en: string }): LabelFunction {
  return ({ i18n }) => {
    const value = labelCache?.[key] ?? fallback;
    return i18n.language === "en" ? value.en : value.tr;
  };
}

/**
 * Synchronous counterpart to `dbLabel` for code that already knows the locale
 * and can't return a `LabelFunction` — server-side hooks building a
 * user-facing message (see hooks/referentialIntegrity.ts). Reads the same
 * boot-populated cache, so it costs nothing per call and still honours an
 * editor's Translations override, falling back to COLLECTION_LABELS and
 * finally the raw slug.
 */
export function collectionLabelText(slug: string, form: "singular" | "plural", locale: "tr" | "en"): string {
  return labelCache?.[`collectionLabel.${slug}.${form}`]?.[locale] ?? COLLECTION_LABELS[slug]?.[locale] ?? slug;
}
