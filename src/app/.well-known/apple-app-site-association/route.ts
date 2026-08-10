/**
 * iOS Universal Links association file.
 *
 * This is the actual fix for the Safari→app auth-handoff bug: when this file
 * is correctly served (no redirects, valid JSON, matching Team ID/Bundle ID),
 * iOS intercepts taps on these paths *before* Safari ever opens — the native
 * app launches directly and uses its own stored session. There is no token
 * to hand off, because Safari's cookie jar is never involved.
 *
 * TODO before going live: replace TEAMID.BUNDLEID with the real value
 * (Apple Developer account Team ID + the app's bundle identifier, e.g.
 * "AB12CD34EF.com.vodafone.pay"). Must be served at exactly this path with
 * Content-Type application/json and zero redirects — Apple's CDN fetches it
 * once and caches it, and will not follow a 3xx.
 */
const TEAM_AND_BUNDLE_ID = process.env.NEXT_PUBLIC_APPLE_APP_ID || "TEAMID.BUNDLEID";

const body = {
  applinks: {
    apps: [],
    details: [
      {
        appID: TEAM_AND_BUNDLE_ID,
        paths: [
          "/kampanyalar/*",
          "/blog/*",
          "/sikca-sorulan-sorular",
          "/ucretler-ve-limitler",
          "/vodafone-pay-uygulama",
          "/vodafone-pay-kart",
          "/faturana-yansit",
          "/qr-ile-faturana-yansit",
          "/aninda-bakiye",
          "NOT /admin/*",
          "NOT /api/*",
        ],
      },
    ],
  },
  webcredentials: {
    apps: [TEAM_AND_BUNDLE_ID],
  },
};

export async function GET() {
  return Response.json(body, {
    headers: { "Content-Type": "application/json" },
  });
}
