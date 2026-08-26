import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SiteHaritasi from "@/app/site-haritasi/page";
import { getNavLinks, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getNavLinks: vi.fn(), getPageMeta: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("SiteHaritasi", () => {
  it("falls back to its own hardcoded group list when the CMS has no nav links", async () => {
    vi.mocked(getNavLinks).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await SiteHaritasi());

    expect(screen.getByText("Vodafone Pay Uygulaması")).toBeInTheDocument();
  });

  it("builds groups from CMS nav links, sectioned and sorted by order", async () => {
    vi.mocked(getNavLinks).mockResolvedValue([
      { label: "İkinci", href: "/ikinci", section: "header-main", order: 2 },
      { label: "Birinci", href: "/birinci", section: "header-main", order: 1 },
    ] as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await SiteHaritasi());

    const links = screen.getAllByRole("link").map((a) => a.textContent);
    expect(links.indexOf("Birinci")).toBeLessThan(links.indexOf("İkinci"));
    expect(screen.queryByText("Vodafone Pay Uygulaması")).not.toBeInTheDocument();
  });
});
