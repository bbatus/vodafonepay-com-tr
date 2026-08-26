import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { isValidPreviewSecret } from "@/lib/previewSecret";

/**
 * RFP feedback 1.7: the CMS's "Önizle" button opens this URL instead of
 * linking straight at the public page — that only ever showed the last
 * PUBLISHED version, so a draft or a pending edit looked like nothing had
 * changed. This enables Next.js Draft Mode and redirects into the real
 * page, which then fetches the CMS with `draft=true` (see
 * getCampaignBySlug in lib/cms.ts) instead of the cached published fetch.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const path = searchParams.get("path");

  if (!isValidPreviewSecret(secret)) {
    return new Response("Invalid preview secret", { status: 401 });
  }
  // Must be a same-site relative path — an absolute/external `path` here
  // would be an open redirect (CMS builds this value itself in normal use,
  // but the query param is still attacker-visible/tamperable in transit).
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return new Response("Invalid preview path", { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();
  redirect(path);
}
