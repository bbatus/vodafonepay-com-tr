/**
 * Follow-up 25.08: "miniodan ilgili pdf'i açıp gösterecek şekilde kullanıcıyı
 * vodafonepaycomtr'den ayrı bir sayfaya atalım ve orada okusun" — a document
 * row (PDF or audio, see LegalPages.ts's `source: "pdf"` documents) no longer
 * links straight at its raw MinIO URL. It routes through
 * /sozlesmeler-ve-formlar/belge, a dedicated viewer page that embeds the file
 * (an <iframe> for a PDF, an <audio> player for a recording) instead of
 * handing the visitor a bare file URL to download.
 *
 * Same reasoning as the real vodafonepay.com.tr, which also never lets a
 * legal document open directly on its own domain — it redirects to
 * cms.vodafone.com.tr. Ours stays on our own domain (a real Next.js route,
 * not another host) but the effect for the reader — "this isn't the
 * listing page anymore, it's a dedicated place to read/listen to the
 * document" — is the same.
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

export function buildDocumentViewerHref(doc: { url: string; label: string; mimeType?: string | null }): string {
  const params = new URLSearchParams({
    src: doc.url,
    ad: doc.label,
    tur: documentKindOf(doc.mimeType),
  });
  return `/sozlesmeler-ve-formlar/belge?${params.toString()}`;
}
