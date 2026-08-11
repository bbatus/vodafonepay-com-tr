import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  campaignToCard,
  getAnnouncements,
  getBlogPosts,
  getCampaigns,
  getContactInfo,
  getFaqItems,
  getFeatureCards,
  getFeeRows,
  getLegalPage,
  getLimitTables,
  getNavLinks,
  getProductHero,
  getStepCards,
  textToParagraphs,
  type CmsCampaign,
} from "@/lib/cms";

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
const notOk = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response);

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
    description: "Açıklama",
    image: { url: "/img.jpg", alt: "" },
    category: "genel",
    featured: true,
  };

  it("falls back to the campaign title as image alt when alt is empty", () => {
    const card = campaignToCard(base);
    expect(card.imageAlt).toBe("Kampanya");
  });

  it("uses the image alt when provided", () => {
    const card = campaignToCard({ ...base, image: { url: "/img.jpg", alt: "Gerçek alt" } });
    expect(card.imageAlt).toBe("Gerçek alt");
  });

  it("falls back to /kampanyalar when ctaUrl is missing", () => {
    const card = campaignToCard(base);
    expect(card.href).toBe("/kampanyalar");
  });

  it("uses ctaUrl when provided", () => {
    const card = campaignToCard({ ...base, ctaUrl: "/kampanyalar/ozel" });
    expect(card.href).toBe("/kampanyalar/ozel");
  });
});

describe("cms.ts fetch-backed getters", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getCampaigns returns docs on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "1" }] }));
    const result = await getCampaigns();
    expect(result).toEqual([{ id: "1" }]);
  });

  it("getCampaigns returns null when the response is not ok", async () => {
    vi.mocked(fetch).mockImplementation(() => notOk());
    expect(await getCampaigns()).toBeNull();
  });

  it("getCampaigns returns null when fetch throws (CMS unreachable)", async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error("ECONNREFUSED")));
    expect(await getCampaigns()).toBeNull();
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

  it("getBlogPosts returns docs on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "b1" }] }));
    expect(await getBlogPosts()).toEqual([{ id: "b1" }]);
  });

  it("getFeeRows returns docs on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "f1" }] }));
    expect(await getFeeRows()).toEqual([{ id: "f1" }]);
  });

  it("getLimitTables returns docs on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "l1" }] }));
    expect(await getLimitTables()).toEqual([{ id: "l1" }]);
  });

  it("getNavLinks returns docs on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "n1" }] }));
    expect(await getNavLinks()).toEqual([{ id: "n1" }]);
  });

  it("getProductHero returns the first doc, or null if none", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [{ id: "p1" }] }));
    expect(await getProductHero("aninda-bakiye")).toEqual({ id: "p1" });

    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [] }));
    expect(await getProductHero("aninda-bakiye")).toBeNull();
  });

  it("getFeatureCards returns docs on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "fc1" }] }));
    expect(await getFeatureCards("aninda-bakiye")).toEqual([{ id: "fc1" }]);
  });

  it("getStepCards returns docs on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "sc1" }] }));
    expect(await getStepCards("aninda-bakiye")).toEqual([{ id: "sc1" }]);
  });

  it("getAnnouncements returns docs on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "a1" }] }));
    expect(await getAnnouncements()).toEqual([{ id: "a1" }]);
  });

  it("getLegalPage returns the first doc, or null if none", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [{ id: "lp1" }] }));
    expect(await getLegalPage("cerez-politikasi")).toEqual({ id: "lp1" });

    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [] }));
    expect(await getLegalPage("cerez-politikasi")).toBeNull();
  });

  it("getContactInfo returns the global when companyName is present", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ companyName: "Vodafone" }));
    expect(await getContactInfo()).toEqual({ companyName: "Vodafone" });
  });

  it("getContactInfo returns null when the global is empty/unset", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({}));
    expect(await getContactInfo()).toBeNull();
  });
});
