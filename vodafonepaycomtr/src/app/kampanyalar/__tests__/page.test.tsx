import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Kampanyalar from "@/app/kampanyalar/page";
import { getCampaigns, getCategories, getFaqItems, getPageMeta, getTranslation } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return {
    ...actual,
    getCampaigns: vi.fn(),
    getCategories: vi.fn(),
    getFaqItems: vi.fn(),
    getPageMeta: vi.fn(),
    getTranslation: vi.fn(),
    getNavLinks: vi.fn(),
  };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

function mockEmpty() {
  vi.mocked(getCampaigns).mockResolvedValue(null);
  vi.mocked(getCategories).mockResolvedValue(null);
  vi.mocked(getFaqItems).mockResolvedValue(null);
  vi.mocked(getPageMeta).mockResolvedValue(null);
  vi.mocked(getTranslation).mockResolvedValue("Tümü");
}

describe("Kampanyalar", () => {
  it("shows the CMS-unreachable error state when getCampaigns returns null", async () => {
    mockEmpty();
    render(await Kampanyalar());
    expect(screen.getByText(/şu anda yüklenemiyor/)).toBeInTheDocument();
  });

  it("shows the genuinely-empty state when the CMS has zero campaigns", async () => {
    mockEmpty();
    vi.mocked(getCampaigns).mockResolvedValue([]);
    render(await Kampanyalar());
    expect(screen.getByText("Şu anda gösterilecek içerik yok.")).toBeInTheDocument();
  });

  it("renders the filterable campaign list when campaigns exist", async () => {
    mockEmpty();
    vi.mocked(getCampaigns).mockResolvedValue([
      {
        id: "1",
        title: "Yaz Kampanyası",
        description: "D",
        image: { url: "/a.jpg", alt: "a" },
        category: { label: "Kart", slug: "kart" },
        featured: true,
        slug: "yaz-kampanyasi",
        ctaLabel: undefined,
        ctaUrl: undefined,
        startDate: undefined,
        endDate: undefined,
      },
    ] as never);

    render(await Kampanyalar());

    expect(screen.getByText("Yaz Kampanyası")).toBeInTheDocument();
  });
  it("uses the CMS breadcrumbLabel override when set", async () => {
    vi.mocked(getPageMeta).mockResolvedValue({
      id: "1",
      pageKey: "/x",
      breadcrumbLabel: "CMS Kırıntı Etiketi",
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
    } as never);

    render(await Kampanyalar());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });
});
