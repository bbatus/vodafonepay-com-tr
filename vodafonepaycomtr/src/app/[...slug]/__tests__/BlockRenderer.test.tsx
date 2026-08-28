import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockRenderer } from "@/app/[...slug]/page";
import {
  getBlogPosts,
  getCampaigns,
  getContactInfo,
  getFaqItems,
  getFeeRows,
  getLimitTables,
  getRepresentatives,
} from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return {
    ...actual,
    getFaqItems: vi.fn(),
    getCampaigns: vi.fn(),
    getFeeRows: vi.fn(),
    getLimitTables: vi.fn(),
    getBlogPosts: vi.fn(),
    getContactInfo: vi.fn(),
    getRepresentatives: vi.fn(),
  };
});

const image = { url: "/a.jpg", alt: "a" };

describe("BlockRenderer", () => {
  it("hero: renders heading, subheading and CTA", async () => {
    render(
      await BlockRenderer({
        block: { blockType: "hero", heading: "Başlık", subheading: "Alt başlık", image, ctaLabel: "Tıkla", ctaUrl: "/kampanyalar" },
      })
    );
    // ProductHero renders the copy twice on purpose — a white overlay for lg+
    // and a grey strip below the image for mobile, exactly as the live site's
    // markup does — so both branches exist in jsdom at once.
    expect(screen.getAllByText("Başlık").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alt başlık").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Tıkla" })[0]).toHaveAttribute("href", "/kampanyalar");
  });

  it("hero: omits subheading/CTA when unset", async () => {
    render(await BlockRenderer({ block: { blockType: "hero", heading: "Başlık", subheading: undefined, image, ctaLabel: undefined, ctaUrl: undefined } }));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("richText: renders heading and body", async () => {
    render(
      await BlockRenderer({
        block: {
          blockType: "richText",
          heading: "RT Başlık",
          body: { root: { children: [{ type: "paragraph", children: [{ type: "text", text: "İçerik" }] }] } },
        },
      })
    );
    expect(screen.getByText("RT Başlık")).toBeInTheDocument();
    expect(screen.getByText("İçerik")).toBeInTheDocument();
  });

  it("faqList: fetches and renders FAQ items scoped by category", async () => {
    vi.mocked(getFaqItems).mockResolvedValue([{ question: "Soru?", answer: "Cevap", deeplink: undefined }] as never);
    render(await BlockRenderer({ block: { blockType: "faqList", heading: "SSS", category: "kart" } }));
    expect(getFaqItems).toHaveBeenCalledWith("kart");
    expect(screen.getByText("Soru?")).toBeInTheDocument();
  });

  it("campaignGrid: filters campaigns by category when set", async () => {
    vi.mocked(getCampaigns).mockResolvedValue([
      { id: "1", title: "Kart Kampanyası", description: "D", image, category: { label: "Kart", slug: "kart" }, featured: false, slug: "kart-k", ctaLabel: undefined, ctaUrl: undefined, startDate: undefined, endDate: undefined },
      { id: "2", title: "Ödeme Kampanyası", description: "D", image, category: { label: "Ödeme", slug: "odeme" }, featured: false, slug: "odeme-k", ctaLabel: undefined, ctaUrl: undefined, startDate: undefined, endDate: undefined },
    ] as never);
    render(await BlockRenderer({ block: { blockType: "campaignGrid", heading: "Kampanyalar", category: "kart" } }));
    expect(screen.getByText("Kart Kampanyası")).toBeInTheDocument();
    expect(screen.queryByText("Ödeme Kampanyası")).not.toBeInTheDocument();
  });

  it("campaignGrid: shows every campaign when no category filter is set", async () => {
    vi.mocked(getCampaigns).mockResolvedValue([
      { id: "1", title: "Kart Kampanyası", description: "D", image, category: { label: "Kart", slug: "kart" }, featured: false, slug: "kart-k", ctaLabel: undefined, ctaUrl: undefined, startDate: undefined, endDate: undefined },
    ] as never);
    render(await BlockRenderer({ block: { blockType: "campaignGrid", heading: "Kampanyalar", category: undefined } }));
    expect(screen.getByText("Kart Kampanyası")).toBeInTheDocument();
  });

  it("video: embeds the given YouTube id", async () => {
    const { container } = render(await BlockRenderer({ block: { blockType: "video", heading: "Video", youtubeId: "abc123" } }));
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain("abc123");
  });

  it("logoGrid: renders one logo per entry, linked when linkUrl is set", async () => {
    render(
      await BlockRenderer({
        block: {
          blockType: "logoGrid",
          heading: "Logolar",
          logos: [
            { name: "Marka A", logo: { url: "/a.jpg", alt: "" }, linkUrl: "https://a.example.com" },
            { name: "Marka B", logo: { url: "/b.jpg", alt: "" }, linkUrl: undefined },
          ],
        },
      })
    );
    expect(screen.getByAltText("Marka A").closest("a")).toHaveAttribute("href", "https://a.example.com");
    expect(screen.getByAltText("Marka B").closest("a")).toBeNull();
  });

  it("iconCards: renders each card's title and text", async () => {
    render(
      await BlockRenderer({
        block: {
          blockType: "iconCards",
          heading: "Kartlar",
          description: undefined,
          cards: [{ icon: image, title: "Kart 1", text: "Metin 1" }],
        },
      })
    );
    expect(screen.getByText("Kart 1")).toBeInTheDocument();
    expect(screen.getByText("Metin 1")).toBeInTheDocument();
  });

  it("steps: renders each step's number and text", async () => {
    render(
      await BlockRenderer({
        block: { blockType: "steps", heading: "Adımlar", steps: [{ number: "01", text: "Adım metni", image }] },
      })
    );
    // PhoneStepsCarousel also renders a desktop and a mobile branch.
    expect(screen.getAllByText("01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Adım metni").length).toBeGreaterThan(0);
  });

  it("howToEarn: renders the heading, the product image and every step", async () => {
    render(
      await BlockRenderer({
        block: {
          blockType: "howToEarn",
          heading: "Nasıl Kazanırım?",
          image,
          steps: [
            { icon: image, title: "Bakiye Yükle", description: "Kartından yükle" },
            { icon: image, title: "Kazan", description: "Nakit iade kazan" },
          ],
        },
      })
    );
    expect(screen.getByText("Nasıl Kazanırım?")).toBeInTheDocument();
    expect(screen.getByText("Bakiye Yükle")).toBeInTheDocument();
    expect(screen.getByText("Nakit iade kazan")).toBeInTheDocument();
  });

  it("imageWithText: renders heading, copy and image, and can flip the image side", async () => {
    const { container } = render(
      await BlockRenderer({
        block: { blockType: "imageWithText", heading: "Nereden alabilirim?", text: "Mağazalardan.", image, imageSide: "right" },
      })
    );
    expect(screen.getByText("Nereden alabilirim?")).toBeInTheDocument();
    expect(screen.getByText("Mağazalardan.")).toBeInTheDocument();
    // imageSide:right must reorder on desktop only — mobile always shows the image first.
    expect(container.innerHTML).toContain("lg:order-2");
  });

  it("pricesAndLimits: pulls the collections rather than carrying its own numbers", async () => {
    vi.mocked(getFeeRows).mockResolvedValue([{ id: "1", label: "Hizmet Bedeli", value: "31,90 TL", order: 1 }] as never);
    vi.mocked(getLimitTables).mockResolvedValue([] as never);
    render(await BlockRenderer({ block: { blockType: "pricesAndLimits" } }));
    expect(screen.getByText("Hizmet Bedeli")).toBeInTheDocument();
  });

  it("pricesAndLimits: renders nothing when both collections are empty, instead of an empty table shell", async () => {
    vi.mocked(getFeeRows).mockResolvedValue([] as never);
    vi.mocked(getLimitTables).mockResolvedValue([] as never);
    const { container } = render(await BlockRenderer({ block: { blockType: "pricesAndLimits" } }));
    expect(container).toBeEmptyDOMElement();
  });

  it("blogGrid: lists posts and can scope them to one category", async () => {
    vi.mocked(getBlogPosts).mockResolvedValue([
      { id: "1", title: "Yazı A", slug: "a", coverImage: image, body: null, category: { label: "Haberler", slug: "haberler" } },
      { id: "2", title: "Yazı B", slug: "b", coverImage: image, body: null, category: { label: "İpuçları", slug: "ipuclari" } },
    ] as never);
    render(await BlockRenderer({ block: { blockType: "blogGrid", heading: "Bloglar", category: "haberler" } }));
    expect(screen.getByText("Yazı A")).toBeInTheDocument();
    expect(screen.queryByText("Yazı B")).not.toBeInTheDocument();
  });

  it("featureHighlights: renders each feature and prefers an uploaded image over the built-in video", async () => {
    const { container } = render(
      await BlockRenderer({
        block: {
          blockType: "featureHighlights",
          heading: "Ayrıcalıklı Dünya",
          media: image,
          features: [{ icon: image, title: "Nakit İade", description: "Harcadıkça kazan" }],
        },
      })
    );
    expect(screen.getByText("Nakit İade")).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
  });

  it("featureHighlights: falls back to the site's own video when no media is uploaded", async () => {
    const { container } = render(
      await BlockRenderer({
        block: {
          blockType: "featureHighlights",
          heading: undefined,
          media: undefined,
          features: [{ icon: image, title: "Nakit İade", description: "Harcadıkça kazan" }],
        },
      })
    );
    expect(container.querySelector("video")).not.toBeNull();
  });

  it("profileGrid: renders every person with their name and role", async () => {
    render(
      await BlockRenderer({
        block: {
          blockType: "profileGrid",
          heading: "Yönetim Kurulu",
          people: [{ photo: image, name: "Ada Yılmaz", title: "Genel Müdür" }],
        },
      })
    );
    expect(screen.getByText("Ada Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("Genel Müdür")).toBeInTheDocument();
  });

  it("mediaPanel: renders the heading over the background art, with the video when given", async () => {
    const { container } = render(
      await BlockRenderer({
        block: { blockType: "mediaPanel", heading: "Nerelerde kullanılır?", text: "Her yerde.", backgroundImage: image, youtubeId: "abc123" },
      })
    );
    expect(screen.getByText("Nerelerde kullanılır?")).toBeInTheDocument();
    expect(container.querySelector("iframe")).not.toBeNull();
  });

  it("mediaPanel: omits the video when no id is set", async () => {
    const { container } = render(
      await BlockRenderer({
        block: { blockType: "mediaPanel", heading: "Başlık", text: undefined, backgroundImage: image, youtubeId: undefined },
      })
    );
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("contactInfo: renders the global's details, and nothing at all when it is unset", async () => {
    vi.mocked(getContactInfo).mockResolvedValue({ companyName: "Vodafone A.Ş.", address: "İstanbul" } as never);
    const { unmount } = render(await BlockRenderer({ block: { blockType: "contactInfo", heading: "İletişim" } }));
    expect(screen.getByText("Vodafone A.Ş.")).toBeInTheDocument();
    unmount();

    vi.mocked(getContactInfo).mockResolvedValue(null);
    const { container } = render(await BlockRenderer({ block: { blockType: "contactInfo", heading: "İletişim" } }));
    expect(container).toBeEmptyDOMElement();
  });

  it("representatives: lists the collection and honours the limit", async () => {
    vi.mocked(getRepresentatives).mockResolvedValue([
      { id: "1", businessName: "Ada", address: "A", province: "İstanbul", district: "Kadıköy" },
      { id: "2", businessName: "Deniz", address: "B", province: "İzmir", district: "Konak" },
    ] as never);
    render(await BlockRenderer({ block: { blockType: "representatives", heading: "Temsilciler", limit: 1 } }));
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.queryByText("Deniz")).not.toBeInTheDocument();
  });

  it("imageTextSlides: renders each slide's text as a scroller when no sideImage is set", async () => {
    const { container } = render(
      await BlockRenderer({
        block: {
          blockType: "imageTextSlides",
          heading: "Slaytlar",
          intro: undefined,
          sideImage: undefined,
          slides: [{ image, text: "Slayt metni" }],
        },
      })
    );
    expect(screen.getByText("Slayt metni")).toBeInTheDocument();
    // The scroller variant has no dot-navigation buttons (that's the carousel variant below).
    expect(container.querySelectorAll('button[aria-label$=". kart"]').length).toBe(0);
  });

  it("imageTextSlides: renders the fixed-image carousel when sideImage is set", async () => {
    render(
      await BlockRenderer({
        block: {
          blockType: "imageTextSlides",
          heading: "Kartla Kazan",
          intro: "Harcadıkça kazan.",
          sideImage: image,
          slides: [{ image, text: "İlk slayt" }],
        },
      })
    );
    expect(screen.getByText("Kartla Kazan")).toBeInTheDocument();
    expect(screen.getByText("Harcadıkça kazan.")).toBeInTheDocument();
    expect(screen.getByText("İlk slayt")).toBeInTheDocument();
  });

  it("videoList: embeds each video by id and title as a light card grid when no darkBackgroundImage is set", async () => {
    const { container } = render(
      await BlockRenderer({
        block: {
          blockType: "videoList",
          heading: "Videolar",
          subheading: undefined,
          darkBackgroundImage: undefined,
          videos: [{ title: "Video 1", youtubeId: "xyz789" }],
        },
      })
    );
    expect(screen.getByText("Video 1")).toBeInTheDocument();
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain("xyz789");
    expect(container.querySelector("section")?.className).not.toContain("bg-cover");
  });

  it("videoList: renders the dark full-bleed panel when darkBackgroundImage is set", async () => {
    const { container } = render(
      await BlockRenderer({
        block: {
          blockType: "videoList",
          heading: "Nerelerde kullanılır?",
          subheading: "Her yerde geçerli.",
          darkBackgroundImage: image,
          videos: [{ title: "Video 1", youtubeId: "xyz789" }],
        },
      })
    );
    expect(screen.getByText("Nerelerde kullanılır?")).toBeInTheDocument();
    expect(screen.getByText("Her yerde geçerli.")).toBeInTheDocument();
    expect(container.querySelector("section")?.getAttribute("style")).toContain(image.url);
  });

  it("videosWithTabsMarker: renders the fixed VideosWithTabs component", async () => {
    render(await BlockRenderer({ block: { blockType: "videosWithTabsMarker" } }));
    expect(screen.getByText(/Faturana Yansıt'ı alışverişte nasıl kullanırım\?/)).toBeInTheDocument();
  });

  it("leadFormCta: renders the fixed LeadFormCta component", async () => {
    render(await BlockRenderer({ block: { blockType: "leadFormCta" } }));
    expect(screen.getByText("Formu doldurun")).toBeInTheDocument();
  });
});
