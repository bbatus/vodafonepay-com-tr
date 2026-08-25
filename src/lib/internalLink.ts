/**
 * Follow-up 25.08 — RFP §3.2 rich-text internal linking. Payload's Lexical
 * `LinkFeature({ enabledCollections: [...] })` (cms/payload.config.ts) gives
 * editors a document picker for free; what it does NOT do is know how any of
 * this app's collections map to a real site URL — that part is this file.
 *
 * Deliberately scoped to the three collections that resolve to a real,
 * per-document page route: LegalPages (a fixed 5-value enum slug, not one
 * per document) and Categories (a filter key, not a page) are excluded on
 * purpose, not an oversight.
 */
const INTERNAL_LINK_PREFIXES: Record<string, string> = {
  "blog-posts": "/blog/",
  campaigns: "/kampanyalar/",
  pages: "/",
};

export function resolveInternalDocHref(relationTo: string, doc: { slug?: string | null } | null | undefined): string | null {
  const prefix = INTERNAL_LINK_PREFIXES[relationTo];
  if (!prefix || !doc?.slug) return null;
  return `${prefix}${doc.slug}`;
}
