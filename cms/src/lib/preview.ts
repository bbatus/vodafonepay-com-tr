/**
 * RFP §3.2.12 + RFP feedback 1.7: a real draft-mode preview — clicking
 * "Önizle" takes the editor to the ACTUAL site page, rendered by the site's
 * own code with the doc's current (possibly unpublished) content, not an
 * approximation built inside the CMS admin.
 *
 * `sitePreviewUrl` used to link straight at the public page, which only
 * ever showed the last PUBLISHED version — a draft or a pending edit
 * rendered as if nothing had changed, which is exactly the case this
 * feature exists to cover. Now it routes through the site's
 * `/api/preview` endpoint, which turns on Next.js Draft Mode and redirects
 * into the real page; the page then fetches the CMS with `draft=true`,
 * authenticated by `PREVIEW_SECRET` (shared server-to-server secret — see
 * `denyUnauthenticatedDraftRead` in access/authenticated.ts) instead of a
 * logged-in editor session, since the site itself has no such session.
 */
export function sitePreviewUrl(path: string): string {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const secret = process.env.PREVIEW_SECRET || "";
  const params = new URLSearchParams({ secret, path });
  return `${base}/api/preview?${params.toString()}`;
}
