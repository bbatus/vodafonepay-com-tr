/**
 * Android App Links verification file — same purpose as
 * ../apple-app-site-association: lets Android intercept these paths and
 * open the native app directly instead of a browser, so there's no
 * web-session/token to hand off.
 *
 * TODO before going live: replace with the real package name and the
 * signing certificate's SHA-256 fingerprint(s)
 * (`keytool -list -v -keystore <release.keystore>`).
 */
const PACKAGE_NAME = process.env.NEXT_PUBLIC_ANDROID_PACKAGE_NAME || "com.vodafone.pay";
const SHA256_FINGERPRINTS = (process.env.NEXT_PUBLIC_ANDROID_CERT_FINGERPRINTS || "PLACEHOLDER_SHA256_FINGERPRINT")
  .split(",")
  .map((fp) => fp.trim());

const body = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: PACKAGE_NAME,
      sha256_cert_fingerprints: SHA256_FINGERPRINTS,
    },
  },
];

export async function GET() {
  return Response.json(body, {
    headers: { "Content-Type": "application/json" },
  });
}
