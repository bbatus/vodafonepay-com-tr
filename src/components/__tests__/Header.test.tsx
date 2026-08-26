import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/Header";
import { getNavLinks } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getNavLinks: vi.fn() };
});

async function renderHeader() {
  render(await Header());
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
    const user = userEvent.setup();
    vi.mocked(getNavLinks).mockResolvedValue([
      { label: "CMS Menü Linki", href: "/cms-menu", section: "header-main", order: 1 },
    ] as never);
    await renderHeader();

    const trigger = screen.getByText("Ürünler", { selector: "button" });
    await user.hover(trigger.parentElement as HTMLElement);

    expect(screen.getByText("Vodafone Pay Kart")).toBeInTheDocument();
  });
});
