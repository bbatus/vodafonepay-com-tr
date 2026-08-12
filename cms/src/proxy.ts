import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * RFP §3.5.7: admin panelinin ilk açılışta Türkçe olması gerekiyor —
 * tarayıcı dili ne olursa olsun. Payload'ın kendi dil çözümlemesi
 * (getRequestLanguage) sırayla payload-lng cookie -> Accept-Language header
 * -> fallbackLanguage'a bakıyor; yani cookie yokken İngilizce tarayıcılı bir
 * kullanıcı Accept-Language üzerinden doğrudan İngilizce görür,
 * fallbackLanguage="tr" hiç devreye girmez. Bu proxy ilk ziyarette
 * payload-lng cookie'sini tr olarak sabitler; kullanıcı admin panelinden
 * bilinçli olarak EN'e geçerse (Payload kendi cookie'sini günceller) bu
 * proxy tekrar müdahale etmez.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has("payload-lng")) {
    return NextResponse.next();
  }

  request.cookies.set("payload-lng", "tr");
  const response = NextResponse.next({ request });
  response.cookies.set("payload-lng", "tr", { path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  matcher: "/admin/:path*",
};
