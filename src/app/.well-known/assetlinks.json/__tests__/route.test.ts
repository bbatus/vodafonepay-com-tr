import { describe, expect, it } from "vitest";
import { GET } from "@/app/.well-known/assetlinks.json/route";

describe("GET /.well-known/assetlinks.json", () => {
  it("serves the Android App Links verification manifest as application/json", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toBe("application/json");

    const body = await res.json();
    expect(body[0].relation).toContain("delegate_permission/common.handle_all_urls");
    expect(body[0].target.namespace).toBe("android_app");
    expect(Array.isArray(body[0].target.sha256_cert_fingerprints)).toBe(true);
  });
});
