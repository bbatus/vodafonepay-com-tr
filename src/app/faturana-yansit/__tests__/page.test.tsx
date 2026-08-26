import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FaturanaYansit from "@/app/faturana-yansit/page";
import { getContentBlocks, getFaqItems, getFeatureCards, getPageMeta, getProductHero } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return {
    ...actual,
    getFaqItems: vi.fn(),
    getProductHero: vi.fn(),
    getFeatureCards: vi.fn(),
    getContentBlocks: vi.fn(),
    getPageMeta: vi.fn(),
    getNavLinks: vi.fn(),
  };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

function mockEmpty() {
  vi.mocked(getFaqItems).mockResolvedValue(null);
  vi.mocked(getProductHero).mockResolvedValue(null);
  vi.mocked(getFeatureCards).mockResolvedValue(null);
  vi.mocked(getContentBlocks).mockResolvedValue(null);
  vi.mocked(getPageMeta).mockResolvedValue(null);
}

describe("FaturanaYansit", () => {
  it("falls back to hardcoded FAQ/cards/steps when the CMS returns nothing", async () => {
    mockEmpty();
    render(await FaturanaYansit());
    // A fallback FAQ question that only exists in the hardcoded fallbackFaqs array.
    expect(screen.getByText("Faturana Yansıt Nedir?")).toBeInTheDocument();
  });

  it("uses CMS FAQ items instead of the fallback when present", async () => {
    mockEmpty();
    vi.mocked(getFaqItems).mockResolvedValue([{ question: "CMS Soru?", answer: "Cevap", deeplink: undefined }] as never);

    render(await FaturanaYansit());

    expect(screen.getByText("CMS Soru?")).toBeInTheDocument();
    expect(screen.queryByText("Faturana Yansıt Nedir?")).not.toBeInTheDocument();
  });
});
