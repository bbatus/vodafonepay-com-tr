import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  campaignToCard,
  getAnnouncements,
  getBlogPosts,
  getCampaigns,
  getCategories,
  getContactInfo,
  getContentBlocks,
  getFaqItems,
  getFeatureCards,
  getFeeRows,
  getFooterCampaigns,
  getFooterFaqItems,
  getHomepageFaqItems,
  getLegalPage,
  getLimitTables,
  getNavLinks,
  getPageBySlug,
  getPageMeta,
  getPages,
  getProductHero,
  getStepCards,
  getTranslation,
  richTextToLines,
  richTextToPlainText,
  textToParagraphs,
  type CmsCampaign,
} from "@/lib/cms";

const okJson = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
const notOk = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response);
const media = { url: "/img.jpg", alt: "alt text" };

describe("richTextToPlainText", () => {
  const doc = (children: unknown[]) => ({ root: { children } });
  const text = (t: string) => ({ text: t });
  const paragraph = (t: string) => ({ children: [text(t)] });

  it("returns empty string for null/malformed input", () => {
    expect(richTextToPlainText(null, 100)).toBe("");
    expect(richTextToPlainText({}, 100)).toBe("");
  });

  it("flattens paragraphs into one space-joined string", () => {
    expect(richTextToPlainText(doc([paragraph("Merhaba"), paragraph("dünya")]), 100)).toBe("Merhaba dünya");
  });

  it("leaves short text untouched (no ellipsis)", () => {
    expect(richTextToPlainText(doc([paragraph("Kısa metin")]), 100)).toBe("Kısa metin");
  });

  it("hard-truncates with an ellipsis past maxLength, matching the live site's own card teaser style", () => {
    const long = "Toplu taşıma kartları, büyük şehirlerde günlük hayatın vazgeçilmez bir parçasıdır.";
    const result = richTextToPlainText(doc([paragraph(long)]), 20);
    expect(result).toBe("Toplu taşıma kartlar...");
    expect(result).toHaveLength(23);
  });
});

describe("richTextToLines", () => {
  const doc = (children: unknown[]) => ({ root: { children } });
  const text = (t: string) => ({ text: t });
  const paragraph = (t: string) => ({ children: [text(t)] });

  it("returns an empty array for null/malformed input", () => {
    expect(richTextToLines(null)).toEqual([]);
    expect(richTextToLines({})).toEqual([]);
  });

  it("returns one array entry per top-level block, unlike richTextToPlainText's single joined string", () => {
    expect(richTextToLines(doc([paragraph("Birinci belge"), paragraph("İkinci belge")]))).toEqual([
      "Birinci belge",
      "İkinci belge",
    ]);
  });

  it("drops empty/whitespace-only blocks", () => {
    expect(richTextToLines(doc([paragraph("Gerçek satır"), paragraph("   "), paragraph("")]))).toEqual([
      "Gerçek satır",
    ]);
  });

  it("concatenates multiple text runs within one block with no extra spacing (unlike richTextToPlainText)", () => {
    const boldWithinParagraph = { children: [text("Kalın "), text("kelime")] };
    expect(richTextToLines(doc([boldWithinParagraph]))).toEqual(["Kalın kelime"]);
  });
});

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
    category: { label: "Genel", slug: "genel" },
    featured: true,
    ctaLabel: undefined,
    ctaUrl: undefined,
    startDate: undefined,
    endDate: undefined,
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
    const doc = { id: "1", title: "T", description: "D", image: media, category: { label: "Genel", slug: "genel" }, featured: true };
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
      category: { label: "Genel", slug: "genel" },
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

  it("getFaqItems adds a category slug filter to the query when given", async () => {
    // category is now a Categories relationship (RFP feedback 1.3), so the
    // filter has to match the populated subfield, not the old bare-select value.
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getFaqItems("kampanyalar");
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("where[category.slug][equals]=kampanyalar");
  });

  it("getFaqItems always scopes to FAQ categories, slug filter or not", async () => {
    // Categories is shared with Campaigns/BlogPosts and the same slug can
    // legitimately exist in both scopes ("aninda-bakiye" in each) — without
    // this, a slug-only filter could match the wrong scope's category.
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getFaqItems();
    expect(vi.mocked(fetch).mock.calls[0][0] as string).toContain("where[category.scope][equals]=faq");

    await getFaqItems("kampanyalar");
    expect(vi.mocked(fetch).mock.calls[1][0] as string).toContain("where[category.scope][equals]=faq");
  });

  it("getFaqItems returns docs on success", async () => {
    const doc = { id: "f1", question: "Q?", answer: "A", category: { label: "Genel", slug: "genel" }, order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getFaqItems()).toEqual([doc]);
  });

  it("getFooterCampaigns filters to showInFooter=true, capped at 6, sorted by footerOrder", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getFooterCampaigns();
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("where[showInFooter][equals]=true");
    expect(calledUrl).toContain("limit=6");
    expect(calledUrl).toContain("sort=footerOrder");
  });

  it("getFooterCampaigns returns docs on success", async () => {
    const doc = { id: "1", title: "T", description: "D", image: media, category: { label: "Genel", slug: "genel" }, featured: true };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getFooterCampaigns()).toEqual([doc]);
  });

  it("getFooterFaqItems filters to showInFooter=true, capped at 6, sorted by footerOrder", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getFooterFaqItems();
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("where[showInFooter][equals]=true");
    expect(calledUrl).toContain("limit=6");
    expect(calledUrl).toContain("sort=footerOrder");
  });

  it("getFooterFaqItems returns docs on success", async () => {
    const doc = { id: "f1", question: "Q?", answer: "A", category: { label: "Genel", slug: "genel" }, order: 0 };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getFooterFaqItems()).toEqual([doc]);
  });

  it("getHomepageFaqItems filters by showOnHomepage and sorts by homepageOrder", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getHomepageFaqItems();
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("where[showOnHomepage][equals]=true");
    expect(calledUrl).toContain("sort=homepageOrder");
  });

  it("getCategories requires a scope and passes it through as a filter", async () => {
    // Categories is shared taxonomy for two unrelated flows (Campaigns/Blog
    // vs. FAQ) — an unscoped fetch mixed both into one tab list, confirmed
    // live on /kampanyalar (a duplicate "Anında Bakiye" tab + an
    // FAQ-only "Anasayfa" tab leaking into the campaign filter bar).
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await getCategories("campaign");
    expect(vi.mocked(fetch).mock.calls[0][0] as string).toContain("where[scope][equals]=campaign");

    await getCategories("faq");
    expect(vi.mocked(fetch).mock.calls[1][0] as string).toContain("where[scope][equals]=faq");
  });

  it("getTranslation returns the CMS value when present", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ tr: "Hepsi" }] }));
    expect(await getTranslation("filterTabs.all", "Tümü")).toBe("Hepsi");
  });

  it("getTranslation falls back when the row is missing or the CMS is unreachable", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    expect(await getTranslation("filterTabs.all", "Tümü")).toBe("Tümü");

    vi.mocked(fetch).mockImplementation(() => notOk());
    expect(await getTranslation("filterTabs.all", "Tümü")).toBe("Tümü");
  });

  it("getBlogPosts returns docs on success", async () => {
    // `category` is a populated Categories relationship now, not free text —
    // that's what makes /blog's filter tabs able to match the posts at all.
    // No `excerpt` field any more — the card teaser is derived from `body`
    // (see richTextToPlainText tests below).
    const doc = {
      id: "b1",
      title: "T",
      slug: "t",
      coverImage: media,
      body: { root: { children: [] } },
      category: { label: "Kart", slug: "kart" },
    };
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
    expect(await getLegalPage("cerez-politikasi")).toEqual({ ...doc, heroImage: null, groups: [] });

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

  it("getPageBySlug parses the 4 blocks added for product-page parity (iconCards/steps/imageTextSlides/videoList)", async () => {
    const doc = {
      id: "p2",
      title: "Ürün Sayfası",
      slug: "urun-sayfasi",
      layout: [
        { blockType: "iconCards", cards: [{ icon: media, title: "Fayda", text: "Açıklama" }] },
        { blockType: "steps", steps: [{ number: "01", text: "İlk adım", image: media }] },
        { blockType: "imageTextSlides", slides: [{ image: media, text: "Slayt metni" }] },
        { blockType: "videoList", videos: [{ title: "Nasıl Kullanılır", youtubeId: "abc123" }] },
      ],
    };
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [doc] }));
    const result = await getPageBySlug("urun-sayfasi");
    expect(result?.layout.map((b) => b.blockType)).toEqual(["iconCards", "steps", "imageTextSlides", "videoList"]);
  });

  it("getPages returns the full list of editor-built pages", async () => {
    const doc = { id: "p1", title: "T", slug: "t", layout: [] };
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [doc] }));
    expect(await getPages()).toEqual([doc]);
  });

  it("getLegalPage passes through document groups and hero image when present", async () => {
    const doc = {
      id: "lp1",
      slug: "sozlesmeler-ve-formlar",
      title: "T",
      intro: "I",
      heroImage: { url: "/media/hero.png", alt: "Hero" },
      groups: [
        {
          label: "Belgeler",
          documents: [
            { label: "Form", source: "pdf", file: { url: "/docs/form.pdf" }, enabled: true },
            // Follow-up 25.08: the second flow — a document written in the CMS
            // and published at /sozlesmeler-ve-formlar/{slug} instead of being
            // an uploaded PDF. It legitimately has no `file`.
            { label: "Ticari Koşullar", source: "page", slug: "ticari-kosullar", body: { root: {} }, enabled: true },
          ],
        },
      ],
    };
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [doc] }));
    const result = await getLegalPage("sozlesmeler-ve-formlar");
    expect(result?.heroImage).toEqual({ url: "/media/hero.png", alt: "Hero" });

    const [pdfDoc, pageDoc] = result?.groups[0].documents ?? [];
    expect(pdfDoc).toMatchObject({ label: "Form", source: "pdf", file: { url: "/docs/form.pdf" }, enabled: true });
    expect(pageDoc).toMatchObject({ label: "Ticari Koşullar", source: "page", slug: "ticari-kosullar", enabled: true });
    // A page-sourced row has no PDF at all — the schema must tolerate that
    // rather than failing the whole page's parse.
    expect(pageDoc?.file).toBeNull();
  });

  it("getLegalPage defaults a document with no explicit source to the PDF flow", async () => {
    const doc = {
      id: "lp2",
      slug: "sozlesmeler-ve-formlar",
      title: "T",
      intro: "I",
      groups: [{ label: "Eski", documents: [{ label: "Eski Form", file: { url: "/docs/old.pdf" } }] }],
    };
    vi.mocked(fetch).mockImplementationOnce(() => okJson({ docs: [doc] }));
    const result = await getLegalPage("sozlesmeler-ve-formlar");
    expect(result?.groups[0].documents[0]).toMatchObject({ source: "pdf", enabled: true });
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
