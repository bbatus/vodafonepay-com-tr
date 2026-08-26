import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockRenderer } from "@/app/[...slug]/page";
import { getCampaigns, getFaqItems } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getFaqItems: vi.fn(), getCampaigns: vi.fn() };
});

const image = { url: "/a.jpg", alt: "a" };

describe("BlockRenderer", () => {
  it("hero: renders heading, subheading and CTA", async () => {
    render(
      await BlockRenderer({
        block: { blockType: "hero", heading: "Başlık", subheading: "Alt başlık", image, ctaLabel: "Tıkla", ctaUrl: "/kampanyalar" },
      })
    );
    expect(screen.getByText("Başlık")).toBeInTheDocument();
    expect(screen.getByText("Alt başlık")).toBeInTheDocument();
    expect(screen.getByText("Tıkla")).toHaveAttribute("href", "/kampanyalar");
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
        block: { blockType: "iconCards", heading: "Kartlar", cards: [{ icon: image, title: "Kart 1", text: "Metin 1" }] },
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
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Adım metni")).toBeInTheDocument();
  });

  it("imageTextSlides: renders each slide's text", async () => {
    render(
      await BlockRenderer({
        block: { blockType: "imageTextSlides", heading: "Slaytlar", slides: [{ image, text: "Slayt metni" }] },
      })
    );
    expect(screen.getByText("Slayt metni")).toBeInTheDocument();
  });

  it("videoList: embeds each video by id and title", async () => {
    const { container } = render(
      await BlockRenderer({
        block: { blockType: "videoList", heading: "Videolar", videos: [{ title: "Video 1", youtubeId: "xyz789" }] },
      })
    );
    expect(screen.getByText("Video 1")).toBeInTheDocument();
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain("xyz789");
  });
});
