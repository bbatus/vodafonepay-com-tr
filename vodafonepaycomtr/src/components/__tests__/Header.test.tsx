import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/Header";
import { getNavLinks, getProductsMenuPages } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getNavLinks: vi.fn(), getProductsMenuPages: vi.fn() };
});

beforeEach(() => {
  // Every test that doesn't care about Pages-fed menu entries behaves as if
  // no page opted in, which is the pre-`showInProductsMenu` world.
  vi.mocked(getProductsMenuPages).mockResolvedValue(null);
});

async function renderHeader() {
  render(await Header());
}

async function openProductsMenu() {
  const user = userEvent.setup();
  const trigger = screen.getByText("Ürünler", { selector: "button" });
  await user.hover(trigger.parentElement as HTMLElement);
}

describe("Header", () => {
  it("falls back to the hardcoded product/nav links when the CMS returns nothing", async () => {
    vi.mocked(getNavLinks).mockResolvedValue(null);
    await renderHeader();

    // Desktop bar always renders alongside the mobile bar in jsdom.
    expect(screen.getAllByRole("link", { name: "Kampanyalar" }).length).toBeGreaterThan(0);
  });

  it("uses CMS nav links, split by section, over the hardcoded fallback", async () => {
    vi.mocked(getNavLinks).mockResolvedValue([
      { label: "CMS Ürün Linki", href: "/cms-urun", section: "header-products", order: 1 },
      { label: "CMS Menü Linki", href: "/cms-menu", section: "header-main", order: 1 },
    ] as never);
    await renderHeader();

    expect(screen.getByText("CMS Menü Linki")).toBeInTheDocument();
    expect(screen.queryByText("Kampanyalar")).not.toBeInTheDocument();
  });

  it("falls back to the hardcoded product links specifically when the CMS has main-nav links but none tagged header-products", async () => {
    vi.mocked(getNavLinks).mockResolvedValue([
      { label: "CMS Menü Linki", href: "/cms-menu", section: "header-main", order: 1 },
    ] as never);
    await renderHeader();
    await openProductsMenu();

    expect(screen.getByText("Vodafone Pay Kart")).toBeInTheDocument();
  });

  describe("pages that opt into the Ürünler menu themselves (showInProductsMenu)", () => {
    it("lists a page with no NavLinks record at all, linking to its own slug", async () => {
      vi.mocked(getNavLinks).mockResolvedValue(null);
      vi.mocked(getProductsMenuPages).mockResolvedValue([
        { id: "1", title: "Anında Bakiye", slug: "aninda-bakiye", productsMenuOrder: 1 },
      ] as never);
      await renderHeader();
      await openProductsMenu();

      const link = screen.getAllByRole("link", { name: "Anında Bakiye" })[0];
      expect(link).toHaveAttribute("href", "/aninda-bakiye");
      // The hardcoded fallback must not also render once a real source exists.
      expect(screen.queryByText("Faturana Yansıt")).not.toBeInTheDocument();
    });

    it("prefers productsMenuLabel over the page title when one is set", async () => {
      vi.mocked(getNavLinks).mockResolvedValue(null);
      vi.mocked(getProductsMenuPages).mockResolvedValue([
        { id: "1", title: "Vodafone Pay Kart Nedir?", slug: "vodafone-pay-kart", productsMenuLabel: "Vodafone Pay Kart", productsMenuOrder: 1 },
      ] as never);
      await renderHeader();
      await openProductsMenu();

      expect(screen.getAllByRole("link", { name: "Vodafone Pay Kart" }).length).toBeGreaterThan(0);
      expect(screen.queryByText("Vodafone Pay Kart Nedir?")).not.toBeInTheDocument();
    });

    it("merges NavLinks and Pages into one list ordered by their shared position number", async () => {
      vi.mocked(getNavLinks).mockResolvedValue([
        { label: "Elle Yazılmış Rota", href: "/faturana-yansit", section: "header-products", order: 2 },
      ] as never);
      vi.mocked(getProductsMenuPages).mockResolvedValue([
        { id: "1", title: "Üçüncü Sayfa", slug: "ucuncu", productsMenuOrder: 3 },
        { id: "2", title: "Birinci Sayfa", slug: "birinci", productsMenuOrder: 1 },
      ] as never);
      await renderHeader();
      await openProductsMenu();

      // Desktop and mobile both render the dropdown, so scope to the first one.
      const labels = screen
        .getAllByRole("link")
        .map((a) => a.textContent)
        .filter((t): t is string => ["Birinci Sayfa", "Elle Yazılmış Rota", "Üçüncü Sayfa"].includes(t ?? ""));

      expect(labels.slice(0, 3)).toEqual(["Birinci Sayfa", "Elle Yazılmış Rota", "Üçüncü Sayfa"]);
    });

    it("puts a page with no position number last rather than dropping it", async () => {
      vi.mocked(getNavLinks).mockResolvedValue(null);
      vi.mocked(getProductsMenuPages).mockResolvedValue([
        { id: "1", title: "Sırasız Sayfa", slug: "sirasiz" },
        { id: "2", title: "Birinci Sayfa", slug: "birinci", productsMenuOrder: 1 },
      ] as never);
      await renderHeader();
      await openProductsMenu();

      const labels = screen
        .getAllByRole("link")
        .map((a) => a.textContent)
        .filter((t): t is string => ["Birinci Sayfa", "Sırasız Sayfa"].includes(t ?? ""));

      expect(labels.slice(0, 2)).toEqual(["Birinci Sayfa", "Sırasız Sayfa"]);
    });
  });
});
