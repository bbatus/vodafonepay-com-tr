/**
 * Follow-up 25.08 (3): "direkt atması lazımdı dış sayfaya" — a document row
 * (PDF or audio, see LegalPages.ts's `source: "pdf"` documents) links straight
 * at the file's own host. Clicking it LEAVES vodafonepaycomtr entirely and
 * lands on the file itself, where the browser's native PDF viewer / audio
 * player takes over.
 *
 * This is what the real vodafonepay.com.tr does: its legal documents never
 * render inside its own layout, they redirect to cms.vodafone.com.tr/static/…
 * Here that host is MinIO (localhost:9000 in dev, the CMS/CDN origin in prod)
 * — whatever Payload put in the upload's `url`.
 *
 * An earlier round routed these through /sozlesmeler-ve-formlar/belge, a
 * Next.js route that embedded the file in an <iframe>. That kept the visitor
 * on our own domain inside our own chrome, which is exactly what the ask was
 * NOT — the route is gone; don't reintroduce it.
 */

/** MinIO/S3 hostnames this app is actually configured to serve uploads from — see next.config.ts's `images.remotePatterns` for the same allowlist applied to images. */
const ALLOWED_FILE_HOSTS = new Set(["localhost", "minio", "127.0.0.1"]);

export function isAllowedFileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_FILE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export type DocumentKind = "pdf" | "audio";

export function documentKindOf(mimeType: string | null | undefined): DocumentKind {
  return mimeType?.startsWith("audio/") ? "audio" : "pdf";
}

/**
 * The file's own URL, or null if the upload is missing/points somewhere we
 * don't serve uploads from. A null tells the caller to skip the row rather
 * than render a dead "#" link.
 */
export function resolveDocumentFileUrl(file: { url?: string | null } | null | undefined): string | null {
  if (!file?.url || !isAllowedFileUrl(file.url)) return null;
  return file.url;
}
