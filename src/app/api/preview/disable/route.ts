import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/** POST (not GET/Link) so Next's Link prefetching can't clear the cookie before the editor actually clicks "Önizlemeden çık". */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  const draft = await draftMode();
  draft.disable();
  redirect(path && path.startsWith("/") && !path.startsWith("//") ? path : "/");
}
