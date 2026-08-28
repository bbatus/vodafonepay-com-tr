import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { getCampaigns, getHomepageFaqItems, getPageBySlug, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return {
    ...actual,
    getCampaigns: vi.fn(),
    getHomepageFaqItems: vi.fn(),
    getPageMeta: vi.fn(),
    getNavLinks: vi.fn(),
    getPageBySlug: vi.fn(),
  };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

/**
 * `getPageBySlug` MUST be mocked here. Home() asks for the "anasayfa" Pages
 * document first and only falls through to the hardcoded composition these
 * tests exercise when there isn't one. Left unmocked it made a real HTTP call
 * — which, on a machine with the dev CMS running, actually returned the live
 * homepage document and rendered async BlockRenderers that React Testing
 * Library cannot resolve, so the whole tree came back empty and all three
 * tests failed. Environment-dependent, and the reason they were red.
 */
function mockEmpty() {
  vi.mocked(getPageBySlug).mockResolvedValue(null);
  vi.mocked(getCampaigns).mockResolvedValue(null);
  vi.mocked(getHomepageFaqItems).mockResolvedValue(null);
  vi.mocked(getPageMeta).mockResolvedValue(null);
}

describe("Home", () => {
  it("renders the CMS-empty state without crashing — no featured campaigns/faq/steps/highlights sections", async () => {
    mockEmpty();
    render(await Home());
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("shows only featured campaigns among the ones the CMS returns", async () => {
    mockEmpty();
    vi.mocked(getCampaigns).mockResolvedValue([
      { id: "1", title: "Öne Çıkan", description: "D", image: { url: "/a.jpg", alt: "a" }, category: null, featured: true, slug: "one-cikan", ctaLabel: undefined, ctaUrl: undefined, startDate: undefined, endDate: undefined },
      { id: "2", title: "Normal", description: "D", image: { url: "/b.jpg", alt: "b" }, category: null, featured: false, slug: "normal", ctaLabel: undefined, ctaUrl: undefined, startDate: undefined, endDate: undefined },
    ] as never);

    render(await Home());

    expect(screen.getByText("Öne Çıkan")).toBeInTheDocument();
    expect(screen.queryByText("Normal")).not.toBeInTheDocument();
  });

  it("renders homepage FAQ items from the CMS", async () => {
    mockEmpty();
    vi.mocked(getHomepageFaqItems).mockResolvedValue([{ question: "Soru?", answer: "Cevap", deeplink: undefined }] as never);

    render(await Home());

    expect(screen.getByText("Soru?")).toBeInTheDocument();
  });
});
