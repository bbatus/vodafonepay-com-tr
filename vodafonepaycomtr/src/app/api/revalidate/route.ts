import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/** Every tag the CMS actually calls revalidateTag/revalidateGlobalTag with — see cms/src/collections/*.ts and cms/src/globals/*.ts. */
const ALLOWED_TAGS = new Set([
  "campaigns",
  "categories",
  "faq-items",
  "blog-posts",
  "fee-rows",
  "limit-tables",
  "nav-links",
  "announcements",
  "legal-pages",
  "contact-info",
  "content-blocks",
  "representatives",
  "cookie-rows",
  "page-meta",
  "pages",
  "translations",
]);

/**
 * E3, follow-up 25.08 (4): `revalidateTag` alone leaves a page's HTML shell
 * stale until the next natural request after the tag'd fetch reruns —
 * confirmed live: every collection except Campaigns showed this (SSS/Blog/
 * Ücretler ve Limitler needed an F5 to show a just-published change).
 * `revalidatePath` forces the actual route segment to rebuild instead of
 * serving the stale-while-revalidate shell.
 *
 * Nearly every collection here (FaqItems, NavLinks, ContactInfo, …) feeds
 * Header/Footer, which render on every single route — enumerating every
 * concrete path is both incomplete (dynamic segments like
 * /blog/[slug], /kampanyalar/[slug], /temsilci/[id],
 * /sozlesmeler-ve-formlar/[slug] aren't known here) and the wrong tool.
 * `revalidatePath("/", "layout")` is Next's own documented "revalidate all
 * data" call (see node_modules/next/dist/docs/.../revalidatePath.md,
 * "Revalidating all data") — it purges every route under the root layout in
 * one shot, which is every route in this app. cms/src/hooks/revalidate.ts's
 * makeRevalidateHook sends exactly this for every collection/global now, so
 * a publish anywhere is visible to the very next visitor on any page — no
 * per-collection path bookkeeping to keep in sync as new pages are added,
 * and (as of this round) also fixes the empty-page-after-a-fresh-deploy
 * case, since the deploy step's warm-up call uses the same "/" + layout
 * sweep.
 *
 * Path allowlist (not a free-text path) for the same reason ALLOWED_TAGS
 * exists: this endpoint is reachable with only a shared secret, not scoped
 * per-caller, so accepting an arbitrary path would let a leaked secret
 * force-rebuild routes outside the CMS's own concern. `pathType: "layout"`
 * is restricted to "/" — the one path where a layout-level sweep means
 * exactly "everything," not an open-ended dynamic-segment wildcard.
 */
const ALLOWED_PATH_PATTERNS: RegExp[] = [/^\/$/, /^\/kampanyalar$/, /^\/kampanyalar\/[a-z0-9-]+$/, /^\/blog$/, /^\/blog\/[a-z0-9-]+$/];

function isAllowedPath(path: string): boolean {
  return ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

/** In-memory fixed-window rate limit — this is a single-instance internal webhook, not a public API, so a per-process counter is sufficient. */
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
let windowStart = Date.now();
let requestsInWindow = 0;

function isRateLimited(): boolean {
  const now = Date.now();
  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    windowStart = now;
    requestsInWindow = 0;
  }
  requestsInWindow += 1;
  return requestsInWindow > RATE_LIMIT_MAX;
}

function isValidSecret(provided: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so guard that separately —
  // returning early there is fine, it doesn't leak more than the length.
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  if (isRateLimited()) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const secret = request.headers.get("x-revalidate-secret");
  if (!isValidSecret(secret)) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tag = body?.tag;
  if (!tag || typeof tag !== "string") {
    return NextResponse.json({ message: "Missing tag" }, { status: 400 });
  }
  if (!ALLOWED_TAGS.has(tag)) {
    return NextResponse.json({ message: "Unknown tag" }, { status: 400 });
  }

  const rawPaths = Array.isArray(body?.paths) ? body.paths : [];
  const paths: string[] = rawPaths.filter((p: unknown): p is string => typeof p === "string");
  const invalidPath = paths.find((p) => !isAllowedPath(p));
  if (invalidPath) {
    return NextResponse.json({ message: `Unknown path: ${invalidPath}` }, { status: 400 });
  }

  const pathType = body?.pathType === "layout" ? "layout" : "page";
  if (pathType === "layout" && paths.some((p) => p !== "/")) {
    return NextResponse.json({ message: "pathType 'layout' is only allowed for path \"/\"" }, { status: 400 });
  }

  revalidateTag(tag, "max");
  for (const path of paths) {
    revalidatePath(path, pathType === "layout" ? "layout" : undefined);
  }
  return NextResponse.json({ revalidated: true, tag, paths, pathType, now: Date.now() });
}
