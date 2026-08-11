import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  campaignToCard,
  getAnnouncements,
  getBlogPosts,
  getCampaigns,
  getContactInfo,
  getContentBlocks,
  getFaqItems,
  getFeatureCards,
  getFeeRows,
  getLegalPage,
  getLimitTables,
  getNavLinks,
  getPageBySlug,
  getPageMeta,
  getPages,
  getProductHero,
  getStepCards,
  textToParagraphs,
  type CmsCampaign,
} from "@/lib/cms";

const okJson = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
const notOk = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response);
const media = { url: "/img.jpg", alt: "alt text" };

describe("textToParagraphs", () => {
  it("splits on blank lines and trims", () => {
    expect(textToParagraphs("Para 1\n\nPara 2\n\n\nPara 3")).toEqual(["Para 1", "Para 2", "Para 3"]);
  });

  it("drops empty paragraphs", () => {
    expect(textToParagraphs("\n\n  \n\nOnly one")).toEqual(["Only one"]);
  });

  it("returns an empty array for empty input", () => {
    expect(textToParagraphs("")).toEqual([]);
  });
});

describe("campaignToCard", () => {
  const base: CmsCampaign = {
    id: "1",
    title: "Kampanya",
    slug: undefined,
    description: "Açıklama",
    image: { url: "/img.jpg", alt: "" },
    category: "genel",
    featured: true,
    ctaLabel: undefined,
    ctaUrl: undefined,
  };

  it("falls back to the campaign title as image alt when alt is empty", () => {
    const card = campaignToCard(base);
    expect(card.imageAlt).toBe("Kampanya");
  });

  it("uses the image alt when provided", () => {
    const card = campaignToCard({ ...base, image: { url: "/img.jpg", alt: "Gerçek alt" } });
    expect(card.imageAlt).toBe("Gerçek alt");
  });

  it("falls back to /kampanyalar when neither ctaUrl nor slug is set", () => {
    const card = campaignToCard(base);
    expect(card.href).toBe("/kampanyalar");
  });

  it("falls back to the slug-based detail URL when ctaUrl is missing", () => {
    const card = campaignToCard({ ...base, slug: "ornek-kampanya" });
    expect(card.href).toBe("/kampanyalar/ornek-kampanya");
  });

  it("uses ctaUrl when provided, even if slug is also set", () => {
    const card = campaignToCard({ ...base, slug: "ornek-kampanya", ctaUrl: "/kampanyalar/ozel" });
    expect(card.href).toBe("/kampanyalar/ozel");
  });
});

describe("cms.ts fetch-backed getters", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getCampaigns returns docs on success", async () => {
    const doc = { id: "1", title: "T", description: "D", image: media, category: "genel", featured: true };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getCampaigns()).toEqual([doc]);
  });

  it("getCampaigns excludes manually-expired campaigns and campaigns whose endDate has passed", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getCampaigns();
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("where[and][0][campaignStatus][not_equals]=expired");
    expect(calledUrl).toContain("where[and][1][or][0][endDate][exists]=false");
    expect(calledUrl).toContain("where[and][1][or][1][endDate][greater_than_equal]=");
  });

  it("getCampaigns returns null when the response is not ok", async () => {
    vi.mocked(fetch).mockImplementation(() => notOk());
    expect(await getCampaigns()).toBeNull();
  });

  it("getCampaigns returns null when fetch throws (CMS unreachable)", async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error("ECONNREFUSED")));
    expect(await getCampaigns()).toBeNull();
  });

  it("getCampaigns returns null and logs when the CMS sends a shape that doesn't match the schema", async () => {
    // missing required fields (title, image, ...) — this is what a broken/changed CMS schema looks like
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "1" }] }));
    const result = await getCampaigns();
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("response shape mismatch"), expect.anything());
  });

  it("getCampaigns accepts explicit null on optional fields, not just missing keys (Payload's real behavior)", async () => {
    // Confirmed live: Payload's REST API returns unset optional fields as
    // JSON `null` (e.g. ctaLabel/ctaUrl), never omits the key. A schema
    // using bare `.optional()` rejects this and silently falls back —
    // this test pins that regression.
    const doc = {
      id: "1",
      title: "T",
      description: "D",
      image: { url: "/i.jpg", alt: null },
      category: "genel",
      featured: true,
      ctaLabel: null,
      ctaUrl: null,
    };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    const result = await getCampaigns();
    expect(result).not.toBeNull();
    expect(result?.[0]).toMatchObject({ ctaLabel: undefined, ctaUrl: undefined, image: { alt: "" } });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("getCampaigns returns null and logs when the CMS returns invalid JSON", async () => {
    vi.mocked(fetch).mockImplementation(
      () => Promise.resolve({ ok: true, json: () => Promise.reject(new Error("Unexpected token")) } as Response)
    );
    expect(await getCampaigns()).toBeNull();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("invalid JSON"), expect.anything());
  });

  it("passes an AbortSignal with a timeout on every request", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getCampaigns();
    const init = vi.mocked(fetch).mock.calls[0][1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("getFaqItems adds a category filter to the query when given", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getFaqItems("kampanyalar");
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("where[category][equals]=kampanyalar");
  });

  it("getFaqItems omits the category filter when not given", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getFaqItems();
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("where[category]");
  });

  it("getFaqItems returns docs on success", async () => {
    const doc = { id: "f1", question: "Q?", answer: "A", category: "genel", order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getFaqItems()).toEqual([doc]);
  });

  it("getBlogPosts returns docs on success", async () => {
    const doc = { id: "b1", title: "T", slug: "t", coverImage: media, excerpt: "E" };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getBlogPosts()).toEqual([doc]);
  });

  it("getFeeRows returns docs on success", async () => {
    const doc = { id: "f1", label: "L", value: "V", order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getFeeRows()).toEqual([doc]);
  });

  it("getLimitTables returns docs on success", async () => {
    const doc = {
      id: "l1",
      title: "T",
      order: 0,
      rows: [{ category: "Kart", period: "Günlük", unverifiedLimit: "1", verifiedLimit: "2" }],
    };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getLimitTables()).toEqual([doc]);
  });

  it("getNavLinks returns docs on success", async () => {
    const doc = { id: "n1", label: "L", href: "/x", section: "header-main", order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getNavLinks()).toEqual([doc]);
  });

  it("getProductHero returns the first doc, or null if none", async () => {
    const doc = { id: "p1", page: "aninda-bakiye", image: media, heading: "H" };
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [doc] }));
    expect(await getProductHero("aninda-bakiye")).toEqual(doc);

    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [] }));
    expect(await getProductHero("aninda-bakiye")).toBeNull();
  });

  it("getFeatureCards returns docs on success", async () => {
    const doc = { id: "fc1", page: "aninda-bakiye", icon: media, title: "T", text: "X", order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getFeatureCards("aninda-bakiye")).toEqual([doc]);
  });

  it("getStepCards returns docs on success", async () => {
    const doc = { id: "sc1", page: "aninda-bakiye", number: "1", text: "X", image: media, order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getStepCards("aninda-bakiye")).toEqual([doc]);
  });

  it("getAnnouncements returns docs on success", async () => {
    const doc = { id: "a1", title: "T", body: "B", order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getAnnouncements()).toEqual([doc]);
  });

  it("getLegalPage returns the first doc, or null if none", async () => {
    const doc = { id: "lp1", slug: "cerez-politikasi", title: "T", intro: "I" };
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [doc] }));
    expect(await getLegalPage("cerez-politikasi")).toEqual({ ...doc, documents: [] });

    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [] }));
    expect(await getLegalPage("cerez-politikasi")).toBeNull();
  });

  it("getPageMeta scopes the query by pageKey and returns the first doc, or null if none", async () => {
    const doc = { id: "pm1", pageKey: "/aninda-bakiye", breadcrumbLabel: "Anında Bakiye" };
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [doc] }));
    expect(await getPageMeta("/aninda-bakiye")).toEqual(doc);
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain(`where[pageKey][equals]=${encodeURIComponent("/aninda-bakiye")}`);

    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [] }));
    expect(await getPageMeta("/aninda-bakiye")).toBeNull();
  });

  it("getPageBySlug parses a page with a hero block and returns null if none", async () => {
    const doc = {
      id: "p1",
      title: "Test Sayfası",
      slug: "test-sayfasi",
      layout: [{ blockType: "hero", heading: "Merhaba", image: media }],
    };
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [doc] }));
    const result = await getPageBySlug("test-sayfasi");
    expect(result?.layout).toHaveLength(1);
    expect(result?.layout[0]).toMatchObject({ blockType: "hero", heading: "Merhaba" });

    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [] }));
    expect(await getPageBySlug("test-sayfasi")).toBeNull();
  });

  it("getPageBySlug rejects an unrecognized blockType", async () => {
    const doc = { id: "p1", title: "T", slug: "t", layout: [{ blockType: "not-real" }] };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getPageBySlug("t")).toBeNull();
  });

  it("getPages returns the full list of editor-built pages", async () => {
    const doc = { id: "p1", title: "T", slug: "t", layout: [] };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getPages()).toEqual([doc]);
  });

  it("getLegalPage passes through downloadable documents when present", async () => {
    const doc = {
      id: "lp1",
      slug: "sozlesmeler-ve-formlar",
      title: "T",
      intro: "I",
      documents: [{ label: "Form", file: { url: "/docs/form.pdf" } }],
    };
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [doc] }));
    const result = await getLegalPage("sozlesmeler-ve-formlar");
    expect(result?.documents).toEqual([{ label: "Form", file: { url: "/docs/form.pdf" } }]);
  });

  it("getContactInfo returns the global when companyName is present", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ companyName: "Vodafone" }));
    const result = await getContactInfo();
    expect(result?.companyName).toBe("Vodafone");
  });

  it("getContactInfo returns null when the global is empty/unset", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({}));
    expect(await getContactInfo()).toBeNull();
  });

  it("getContentBlocks scopes the query by page and returns docs on success", async () => {
    const doc = { id: "cb1", page: "anasayfa-steps", blockType: "step", title: "T", text: "X", image: media, order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getContentBlocks("anasayfa-steps")).toEqual([doc]);
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("where[page][equals]=anasayfa-steps");
  });

  it("getContentBlocks rejects an unknown blockType", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "cb1", page: "x", blockType: "not-real", order: 0 }] }));
    expect(await getContentBlocks("x")).toBeNull();
  });
});
