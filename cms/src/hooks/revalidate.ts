import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";

/**
 * Notifies the main site's /api/revalidate route so a published change
 * shows up live within seconds instead of waiting for the ISR fallback
 * interval. `revalidateTag` alone leaves an already-rendered page's HTML
 * shell stale until the next request happens to rerun the tagged fetch —
 * E3: this is why /kampanyalar could keep showing a removed/edited
 * campaign for a while after a publish. `paths` (matched against the
 * site's own ALLOWED_PATH_PATTERNS allowlist) forces the actual route
 * segment to rebuild immediately.
 */
async function pingRevalidate(tag: string, paths?: string[]) {
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
      body: JSON.stringify({ tag, paths }),
    });
    const pathsSuffix = paths?.length ? ` + paths [${paths.join(", ")}]` : "";
    console.log(`[revalidate] tag "${tag}"${pathsSuffix} -> ${res.status}`);
  } catch (err) {
    // Best-effort: the site's own ISR interval is the fallback if this fails.
    console.error(`[revalidate] failed for tag "${tag}":`, err);
  }
}

/** Every collection/global hook below just needs to fire-and-forget pingRevalidate(tag) — only the Payload hook signature differs. */
const makeRevalidateHook = (tag: string) => async () => {
  await pingRevalidate(tag);
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
 * E3: Campaigns-specific — also force-rebuilds "/", "/kampanyalar", and the
 * campaign's own "/kampanyalar/{slug}" detail page, not just the "campaigns"
 * tag. Used for both afterChange and afterDelete since either one can make
 * a currently-rendered page stale.
 */
function campaignPaths(doc: unknown): string[] {
  const slug = (doc as { slug?: string } | null)?.slug;
  return ["/", "/kampanyalar", ...(slug ? [`/kampanyalar/${slug}`] : [])];
}

export const revalidateCampaignPaths: CollectionAfterChangeHook = async ({ doc }) => {
  await pingRevalidate("campaigns", campaignPaths(doc));
};

export const revalidateCampaignPathsOnDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await pingRevalidate("campaigns", campaignPaths(doc));
};
