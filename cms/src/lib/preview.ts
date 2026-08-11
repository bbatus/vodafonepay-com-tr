/**
 * RFP §3.2.12: a "Görüntüle" link in the admin doc view pointing at the
 * live site URL for this document. This is NOT a full draft-mode iframe
 * preview (RFP's "preview mobile/desktop view before publishing") — that
 * needs a service-to-service auth token between the CMS and the site
 * (so the site can fetch `?draft=true` content past `denyUnauthenticatedDraftRead`),
 * which doesn't exist yet. This gives editors the next-most-useful thing:
 * one click to the real page, without a deploy or manual URL construction.
 */
export function sitePreviewUrl(path: string): string {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return `${base}${path}`;
}
