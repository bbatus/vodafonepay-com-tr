import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";

/**
 * Notifies the main site's /api/revalidate route so a published change
 * shows up live within seconds instead of waiting for the ISR fallback
 * interval. `revalidateTag` alone leaves an already-rendered page's HTML
 * shell stale until the next request happens to rerun the tagged fetch —
 * confirmed live: this is what let /sikca-sorulan-sorular, /blog, and
 * /ucretler-ve-limitler keep showing stale/empty content until an
 * unrelated F5 happened to land past the stale-while-revalidate window.
 * `pathType: "layout"` on path "/" (see the site's route.ts doc comment)
 * forces every route's HTML shell to rebuild on its very next visit — not
 * just the tagged data.
 */
async function pingRevalidate(tag: string, paths?: string[], pathType?: "page" | "layout") {
  const url = process.env.SITE_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) {
    console.warn(`[revalidate] skipped for tag "${tag}": SITE_REVALIDATE_URL or REVALIDATE_SECRET not set`);
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tag, paths, pathType }),
    });
    const pathsSuffix = paths?.length ? ` + paths [${paths.join(", ")}]${pathType ? ` (${pathType})` : ""}` : "";
    console.log(`[revalidate] tag "${tag}"${pathsSuffix} -> ${res.status}`);
  } catch (err) {
    // Best-effort: the site's own ISR interval is the fallback if this fails.
    console.error(`[revalidate] failed for tag "${tag}":`, err);
  }
}

/**
 * Every collection/global hook below fires the same tag + full-site sweep —
 * see route.ts's doc comment for why a single "/", "layout" call replaces
 * what used to be per-collection path guesswork (Campaigns used to be the
 * only one with real paths; everything else silently relied on
 * stale-while-revalidate). Only the Payload hook signature differs per call
 * site, not the invalidation itself.
 */
const makeRevalidateHook = (tag: string) => async () => {
  await pingRevalidate(tag, ["/"], "layout");
};

export function revalidateTag(tag: string): CollectionAfterChangeHook {
  return makeRevalidateHook(tag);
}

export function revalidateTagOnDelete(tag: string): CollectionAfterDeleteHook {
  return makeRevalidateHook(tag);
}

export function revalidateGlobalTag(tag: string): GlobalAfterChangeHook {
  return makeRevalidateHook(tag);
}

/**
 * Campaigns used to be the only collection with real path targeting; now
 * that every collection gets the same "/", layout sweep, this is
 * functionally the same call — kept as its own named export (rather than
 * folded into makeRevalidateHook) only because Campaigns.ts already
 * references it by this name and the extra specificity costs nothing.
 */
export const revalidateCampaignPaths: CollectionAfterChangeHook = async () => {
  await pingRevalidate("campaigns", ["/"], "layout");
};

export const revalidateCampaignPathsOnDelete: CollectionAfterDeleteHook = async () => {
  await pingRevalidate("campaigns", ["/"], "layout");
};
