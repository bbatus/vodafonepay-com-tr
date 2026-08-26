/**
 * RFP feedback 1.7: shown at the top of any page rendered under Next.js
 * Draft Mode, so an editor previewing an unpublished/edited campaign can
 * tell it's the draft, not the live public page — and get back out of
 * preview mode. `GET`-driven exits are unsafe here (Link prefetching would
 * disable Draft Mode before the click), so this is a real form POST.
 *
 * Follow-up 25.08: /api/preview/disable now requires the same
 * PREVIEW_SECRET /api/preview does. This is a Server Component, so it can
 * read the secret straight from process.env and embed it in the form's own
 * action URL — never sent to a client bundle, only ever rendered for
 * someone who's already in preview mode (i.e. already used the secret once
 * to get here).
 */
export function PreviewBanner({ path }: { path: string }) {
  const secret = process.env.PREVIEW_SECRET ?? "";
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-vf-red px-4 py-2 text-sm font-medium text-white">
      <span>Taslak önizleme — bu, henüz yayınlanmamış/kaydedilmiş halinin canlı sitede nasıl görüneceğidir.</span>
      <form
        action={`/api/preview/disable?path=${encodeURIComponent(path)}&secret=${encodeURIComponent(secret)}`}
        method="POST"
      >
        <button type="submit" className="rounded border border-white/60 px-2 py-0.5 hover:bg-white/10">
          Önizlemeden çık
        </button>
      </form>
    </div>
  );
}
