import { afterEach, describe, expect, it, vi } from "vitest";
import { sitePreviewUrl } from "@/lib/preview";

describe("sitePreviewUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("routes through the site's /api/preview endpoint with the secret and path", () => {
    vi.stubEnv("SITE_URL", "https://vodafonepay.com.tr");
    vi.stubEnv("PREVIEW_SECRET", "the-secret");

    const url = sitePreviewUrl("/kampanyalar/yaz-kampanyasi");

    expect(url).toBe(
      "https://vodafonepay.com.tr/api/preview?secret=the-secret&path=%2Fkampanyalar%2Fyaz-kampanyasi"
    );
  });

  it("falls back to localhost:3000 when SITE_URL is unset", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("PREVIEW_SECRET", "s");

    expect(sitePreviewUrl("/x")).toContain("http://localhost:3000/api/preview");
  });

  it("still builds a (failing) URL rather than throwing when PREVIEW_SECRET is unset", () => {
    vi.stubEnv("SITE_URL", "https://vodafonepay.com.tr");
    vi.stubEnv("PREVIEW_SECRET", "");

    expect(sitePreviewUrl("/x")).toContain("secret=&path=%2Fx");
  });
});
