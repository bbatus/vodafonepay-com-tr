/**
 * E3: replaces the fake-content fallback arrays that used to mask a dead
 * CMS (kampanyalar/blog previously showed hardcoded campaigns/posts when
 * the CMS was unreachable, so nobody noticed the connection had died — see
 * getCampaigns/getBlogPosts in lib/cms.ts, which return `null` on any
 * fetch/parse failure and `[]` when the CMS is reachable but genuinely has
 * zero matching documents). This renders an honest state for each case
 * instead of silently substituting stale placeholder content.
 */
export function ContentUnavailable({ variant }: { variant: "error" | "empty" }) {
  const message =
    variant === "error"
      ? "İçerik şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin."
      : "Şu anda gösterilecek içerik yok.";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-base text-gray-500">{message}</p>
    </div>
  );
}
