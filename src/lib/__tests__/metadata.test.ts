import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMetadata, buildPageMetadata } from "@/lib/metadata";
import { getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", () => ({ getPageMeta: vi.fn() }));

describe("buildMetadata", () => {
  it("fills canonical/openGraph/twitter from title, description and path", () => {
    const meta = buildMetadata({ title: "Başlık", description: "Açıklama", path: "/ornek" });

    expect(meta.title).toBe("Başlık");
    expect(meta.alternates).toEqual({ canonical: "http://localhost:3000/ornek" });
    expect(meta.openGraph).toMatchObject({ title: "Başlık", description: "Açıklama", siteName: "Vodafone Pay" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Başlık" });
  });

  it("splits comma-separated keywords into a trimmed array", () => {
    const meta = buildMetadata({ title: "t", description: "d", path: "/p", keywords: "ödeme,  vodafone pay ,mobil" });

    expect(meta.keywords).toEqual(["ödeme", "vodafone pay", "mobil"]);
  });

  it("omits the keywords tag entirely rather than rendering an empty one", () => {
    const withUndefined = buildMetadata({ title: "t", description: "d", path: "/p" });
    const withEmpty = buildMetadata({ title: "t", description: "d", path: "/p", keywords: "" });

    expect(withUndefined.keywords).toBeUndefined();
    expect(withEmpty.keywords).toBeUndefined();
  });

  it("uses the default OG image unless a specific one is given", () => {
    const meta = buildMetadata({ title: "t", description: "d", path: "/p" });
    expect((meta.openGraph as { images: { url: string }[] }).images[0].url).toBe("/images/hero-spotlight.jpg");

    const withImage = buildMetadata({ title: "t", description: "d", path: "/p", image: "/images/custom.jpg" });
    expect((withImage.openGraph as { images: { url: string }[] }).images[0].url).toBe("/images/custom.jpg");
  });
});

describe("buildPageMetadata", () => {
  afterEach(() => {
    vi.mocked(getPageMeta).mockReset();
  });

  it("prefers CMS-edited SEO fields over the page's hardcoded defaults", async () => {
    vi.mocked(getPageMeta).mockResolvedValue({
      id: "1",
      pageKey: "/ornek",
      breadcrumbLabel: undefined,
      seoTitle: "CMS Başlığı",
      seoDescription: "CMS Açıklaması",
      seoKeywords: "cms,seo",
      ogImage: undefined,
    });

    const meta = await buildPageMetadata("/ornek", { title: "Varsayılan Başlık", description: "Varsayılan Açıklama" });

    expect(meta.title).toBe("CMS Başlığı");
    expect(meta.description).toBe("CMS Açıklaması");
    expect(meta.keywords).toEqual(["cms", "seo"]);
  });

  it("falls back to the page's own defaults when no PageMeta document exists", async () => {
    vi.mocked(getPageMeta).mockResolvedValue(null);

    const meta = await buildPageMetadata("/ornek", { title: "Varsayılan Başlık", description: "Varsayılan Açıklama" });

    expect(meta.title).toBe("Varsayılan Başlık");
    expect(meta.description).toBe("Varsayılan Açıklama");
  });

  it("falls back field-by-field — a CMS title with no CMS description still keeps the page's own description", async () => {
    vi.mocked(getPageMeta).mockResolvedValue({
      id: "1",
      pageKey: "/ornek",
      breadcrumbLabel: undefined,
      seoTitle: "CMS Başlığı",
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
    });

    const meta = await buildPageMetadata("/ornek", { title: "Varsayılan Başlık", description: "Varsayılan Açıklama" });

    expect(meta.title).toBe("CMS Başlığı");
    expect(meta.description).toBe("Varsayılan Açıklama");
  });
});
