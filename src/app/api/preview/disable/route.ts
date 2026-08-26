import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { isValidPreviewSecret } from "@/lib/previewSecret";

/**
 * POST (not GET/Link) so Next's Link prefetching can't clear the cookie
 * before the editor actually clicks "Önizlemeden çık". Follow-up 25.08:
 * gated on the same PREVIEW_SECRET as /api/preview — this was reachable
 * with no auth at all before (harmless in practice, since it only ever
 * clears the CALLER'S OWN draft-mode cookie, never another session's), but
 * every mutating endpoint should require the same secret the rest of the
 * preview flow does, not just the ones with a real blast radius.
 * PreviewBanner.tsx (a Server Component) reads the secret straight from
 * process.env and embeds it in the form's action URL — the value is only
 * ever shown to someone who already reached preview mode with it.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const path = searchParams.get("path");

  if (!isValidPreviewSecret(secret)) {
    return new Response("Invalid preview secret", { status: 401 });
  }

  const draft = await draftMode();
  draft.disable();
  redirect(path && path.startsWith("/") && !path.startsWith("//") ? path : "/");
}
