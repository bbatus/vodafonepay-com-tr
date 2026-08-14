/**
 * RFP feedback 1.7: shown at the top of any page rendered under Next.js
 * Draft Mode, so an editor previewing an unpublished/edited campaign can
 * tell it's the draft, not the live public page — and get back out of
 * preview mode. `GET`-driven exits are unsafe here (Link prefetching would
 * disable Draft Mode before the click), so this is a real form POST.
 */
export function PreviewBanner({ path }: { path: string }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-vf-red px-4 py-2 text-sm font-medium text-white">
      <span>Taslak önizleme — bu, henüz yayınlanmamış/kaydedilmiş halinin canlı sitede nasıl görüneceğidir.</span>
      <form action={`/api/preview/disable?path=${encodeURIComponent(path)}`} method="POST">
        <button type="submit" className="rounded border border-white/60 px-2 py-0.5 hover:bg-white/10">
          Önizlemeden çık
        </button>
      </form>
    </div>
  );
}
