import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

/**
 * Notifies the main site's /api/revalidate route so a published change
 * shows up live within seconds instead of waiting for the ISR fallback interval.
 */
async function pingRevalidate(tag: string) {
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
      body: JSON.stringify({ tag }),
    });
    console.log(`[revalidate] tag "${tag}" -> ${res.status}`);
  } catch (err) {
    // Best-effort: the site's own ISR interval is the fallback if this fails.
    console.error(`[revalidate] failed for tag "${tag}":`, err);
  }
}

export function revalidateTag(tag: string): CollectionAfterChangeHook {
  return async () => {
    await pingRevalidate(tag);
  };
}

export function revalidateTagOnDelete(tag: string): CollectionAfterDeleteHook {
  return async () => {
    await pingRevalidate(tag);
  };
}
