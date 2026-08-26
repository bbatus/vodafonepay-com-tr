import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/Footer";
import { getFooterCampaigns, getFooterFaqItems, getNavLinks } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getNavLinks: vi.fn(), getFooterCampaigns: vi.fn(), getFooterFaqItems: vi.fn() };
});

/** Footer is an async Server Component — RTL's render() needs the resolved element, not the async function itself. */
async function renderFooter() {
  render(await Footer());
}

describe("Footer", () => {
  it("falls back to the hardcoded Kurumsal/Yasal links when the CMS returns nothing", async () => {
    vi.mocked(getNavLinks).mockResolvedValue(null);
    vi.mocked(getFooterCampaigns).mockResolvedValue(null);
    vi.mocked(getFooterFaqItems).mockResolvedValue(null);

    await renderFooter();

    expect(screen.getByText("İletişim")).toBeInTheDocument();
    expect(screen.getByText("Site Haritası")).toBeInTheDocument();
  });

  it("uses CMS-provided nav links for Kurumsal/Yasal when present", async () => {
    vi.mocked(getNavLinks).mockResolvedValue([
      { label: "CMS Kurumsal Link", href: "/cms-kurumsal", section: "footer-kurumsal", order: 1 },
    ] as never);
    vi.mocked(getFooterCampaigns).mockResolvedValue(null);
    vi.mocked(getFooterFaqItems).mockResolvedValue(null);

    await renderFooter();

    expect(screen.getByText("CMS Kurumsal Link")).toBeInTheDocument();
    // The hardcoded fallback for this same section must not also render.
    expect(screen.queryByText("Temsilciliklerimiz")).not.toBeInTheDocument();
  });

  it("renders no Sık Sorulanlar links when nothing has been flagged for the footer — no hardcoded fallback here on purpose", async () => {
    vi.mocked(getNavLinks).mockResolvedValue(null);
    vi.mocked(getFooterCampaigns).mockResolvedValue(null);
    vi.mocked(getFooterFaqItems).mockResolvedValue([]);

    await renderFooter();

    const heading = screen.getByText("Sık Sorulanlar");
    const list = heading.parentElement?.querySelector("ul");
    expect(list?.children.length).toBe(0);
  });

  it("renders one footer link per flagged FAQ item and campaign", async () => {
    vi.mocked(getNavLinks).mockResolvedValue(null);
    vi.mocked(getFooterCampaigns).mockResolvedValue([
      {
        id: "1",
        title: "Yaz Kampanyası",
        description: "",
        image: { url: "/img.jpg", alt: "" },
        slug: "yaz-kampanyasi",
        ctaUrl: null,
        ctaLabel: null,
        startDate: null,
        endDate: null,
      },
    ] as never);
    vi.mocked(getFooterFaqItems).mockResolvedValue([{ id: "1", question: "Soru?", answer: "Cevap" }] as never);

    await renderFooter();

    expect(screen.getByText("Yaz Kampanyası")).toBeInTheDocument();
    expect(screen.getByText("Soru?")).toBeInTheDocument();
  });

  it("marks external links (absolute http(s) URLs) to open in a new tab, unlike internal ones", async () => {
    vi.mocked(getNavLinks).mockResolvedValue(null);
    vi.mocked(getFooterCampaigns).mockResolvedValue(null);
    vi.mocked(getFooterFaqItems).mockResolvedValue(null);

    await renderFooter();

    const external = screen.getByText("Bilgi Toplum Hizmetleri").closest("a");
    expect(external).toHaveAttribute("target", "_blank");
    const internal = screen.getByText("İletişim").closest("a");
    expect(internal).not.toHaveAttribute("target");
  });
});
