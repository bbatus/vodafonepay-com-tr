import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VodafonePayKart from "@/app/vodafone-pay-kart/page";
import { getContentBlocks, getFaqItems, getPageMeta, getProductHero } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return {
    ...actual,
    getFaqItems: vi.fn(),
    getProductHero: vi.fn(),
    getContentBlocks: vi.fn(),
    getPageMeta: vi.fn(),
    getNavLinks: vi.fn(),
  };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("VodafonePayKart", () => {
  it("renders the default hero heading and no optional sections when the CMS returns nothing", async () => {
    vi.mocked(getFaqItems).mockResolvedValue(null);
    vi.mocked(getProductHero).mockResolvedValue(null);
    vi.mocked(getContentBlocks).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await VodafonePayKart());

    expect(screen.getByText("Vodafone Pay Kart ile dilediğin yerde harca, kazan")).toBeInTheDocument();
  });

  it("uses the CMS hero heading over the default when present", async () => {
    vi.mocked(getFaqItems).mockResolvedValue(null);
    vi.mocked(getProductHero).mockResolvedValue({
      image: { url: "/cms.jpg", alt: "a" },
      heading: "CMS Başlığı",
    } as never);
    vi.mocked(getContentBlocks).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await VodafonePayKart());

    expect(screen.getByText("CMS Başlığı")).toBeInTheDocument();
  });
});
