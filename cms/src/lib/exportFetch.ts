import { describeApiError } from "@/lib/apiErrorMessage";

/**
 * The fetch step every export button (CSV, CEF) shares byte-for-byte:
 * forward the list view's on-screen `where`/`sort` from the URL so exporting
 * after a search/filter exports what's ON SCREEN, override `limit` (the
 * visible page is paginated to 10, an export should carry every matching
 * row), then throw a describable error on failure. Kept separate from the
 * serialization step (CSV row-building vs CEF event-building) on purpose —
 * see CefExportButton.tsx's doc comment for why the two formats don't share
 * a `buildTable`-shaped seam.
 */
export async function fetchExportDocs<T>(args: {
  collection: string;
  defaultSort: string;
  depth: number;
  locale: "tr" | "en";
}): Promise<T[]> {
  const { collection, defaultSort, depth, locale } = args;
  const currentParams = new URLSearchParams(window.location.search);
  const params = new URLSearchParams();
  const where = currentParams.get("where");
  const search = currentParams.get("search");
  if (where) params.set("where", where);
  if (search) params.set("search", search);
  params.set("sort", currentParams.get("sort") ?? defaultSort);
  params.set("limit", "10000");
  params.set("depth", String(depth));

  const res = await fetch(`/api/${collection}?${params.toString()}`, { credentials: "same-origin" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(describeApiError({ status: res.status, body, locale, context: "export" }));
  }
  const data = (await res.json()) as { docs?: T[] };
  return data.docs ?? [];
}

/** Best-effort export audit ping shared by every export button — a logging hiccup must never block a download the user already has in hand. */
export function pingExportAudit(collection: string, count: number): void {
  void fetch("/api/audit/export", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ collection, count }),
  }).catch(() => {});
}
