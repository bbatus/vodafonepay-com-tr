import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BilgiGuvenligi from "@/app/bilgi-guvenligi/page";
import { getLegalPage, getPageMeta } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getLegalPage: vi.fn(), getPageMeta: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("BilgiGuvenligi", () => {
  it("falls back to the hardcoded tip list when the CMS has no legal page", async () => {
    vi.mocked(getLegalPage).mockResolvedValue(null);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await BilgiGuvenligi());

    expect(screen.getByText(/Sizi arayan ve kendilerini avukat/)).toBeInTheDocument();
  });

  it("lists CMS-provided tips instead of the fallback when a legal page exists", async () => {
    vi.mocked(getLegalPage).mockResolvedValue({
      id: "1",
      slug: "bilgi-guvenligi",
      title: "T",
      intro: { root: { children: [{ type: "paragraph", children: [{ type: "text", text: "CMS ipucu" }] }] } },
      heroImage: null,
      groups: [],
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue(null);

    render(await BilgiGuvenligi());

    expect(screen.getByText("CMS ipucu")).toBeInTheDocument();
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

    render(await BilgiGuvenligi());

    expect(screen.getByText("CMS Kırıntı Etiketi")).toBeInTheDocument();
  });
});
