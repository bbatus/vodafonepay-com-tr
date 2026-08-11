import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/** Every tag the CMS actually calls revalidateTag/revalidateGlobalTag with — see cms/src/collections/*.ts and cms/src/globals/*.ts. */
const ALLOWED_TAGS = new Set([
  "campaigns",
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
]);

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

  revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: true, tag, now: Date.now() });
}
