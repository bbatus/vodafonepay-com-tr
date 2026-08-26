import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Duyurular from "@/app/duyurular/page";
import { getAnnouncements, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getAnnouncements: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("Duyurular", () => {
  it("renders no items when the CMS has no announcements", async () => {
    vi.mocked(getAnnouncements).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await Duyurular());

    expect(screen.getByRole("heading", { name: "Duyurular" })).toBeInTheDocument();
  });

  it("renders each CMS announcement's title and body paragraphs", async () => {
    vi.mocked(getAnnouncements).mockResolvedValue([
      { id: "1", title: "Duyuru Başlığı", body: "Paragraf 1\n\nParagraf 2", deeplink: undefined, order: 0 },
    ] as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await Duyurular());

    expect(screen.getByText("Duyuru Başlığı")).toBeInTheDocument();
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

    render(await Duyurular());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });
});
