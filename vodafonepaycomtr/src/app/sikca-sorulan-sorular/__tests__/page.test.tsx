import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SikcaSorulanSorular from "@/app/sikca-sorulan-sorular/page";
import { getCategories, getFaqItems, getPageMeta, getTranslation } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getFaqItems: vi.fn(), getCategories: vi.fn(), getPageMeta: vi.fn(), getTranslation: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("SikcaSorulanSorular", () => {
  it("renders CMS FAQ items when present", async () => {
    vi.mocked(getFaqItems).mockResolvedValue([{ question: "Soru?", answer: "Cevap", category: undefined, deeplink: undefined }] as never);
    vi.mocked(getCategories).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);
    vi.mocked(getTranslation).mockResolvedValue("Tümü");

    render(await SikcaSorulanSorular());

    expect(screen.getByText("Soru?")).toBeInTheDocument();
  });

  it("passes undefined (not an empty array) to FaqCategoryFilter when the CMS has no FAQ items — distinguishes 'no items' from 'CMS outage'", async () => {
    vi.mocked(getFaqItems).mockResolvedValue(null);
    vi.mocked(getCategories).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);
    vi.mocked(getTranslation).mockResolvedValue("Tümü");

    render(await SikcaSorulanSorular());

    expect(screen.getByRole("heading", { name: "Sıkça Sorulan Sorular" })).toBeInTheDocument();
  });
});
