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
  "product-heroes",
  "feature-cards",
  "step-cards",
  "announcements",
  "legal-pages",
  "contact-info",
  "content-blocks",
  "representatives",
  "cookie-rows",
  "page-meta",
  "pages",
]);

/**
 * E3: `revalidateTag` alone leaves a page's HTML shell stale until the next
 * natural request after the tag'd fetch reruns — this is what let
 * /kampanyalar keep showing a removed/edited campaign for a while after a
 * publish. `revalidatePath` forces the actual route segment to rebuild.
 * Path allowlist (not a free-text path) for the same reason ALLOWED_TAGS
 * exists: this endpoint is reachable with only a shared secret, not scoped
 * per-caller, so accepting an arbitrary path would let a leaked secret
 * force-rebuild routes outside the CMS's own concern.
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

  revalidateTag(tag, "max");
  for (const path of paths) {
    revalidatePath(path);
  }
  return NextResponse.json({ revalidated: true, tag, paths, now: Date.now() });
}
