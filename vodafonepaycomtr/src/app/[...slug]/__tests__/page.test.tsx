import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EditorPage, { generateMetadata, generateStaticParams } from "@/app/[...slug]/page";
import { getPageBySlug, getPageMeta, getPages } from "@/lib/cms";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getPageBySlug: vi.fn(), getPageMeta: vi.fn(), getPages: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

describe("generateStaticParams", () => {
  it("maps each editor page to its slug segments", async () => {
    vi.mocked(getPages).mockResolvedValue([
      { id: "1", title: "T", slug: "vodafone-pay-uygulama", layout: [], seoTitle: undefined, seoDescription: undefined, seoKeywords: undefined, ogImage: undefined, parent: undefined },
    ] as never);

    const params = await generateStaticParams();

    expect(params).toEqual([{ slug: ["vodafone-pay-uygulama"] }]);
  });

  it("returns an empty array when the CMS has no pages", async () => {
    vi.mocked(getPages).mockResolvedValue(null);
    expect(await generateStaticParams()).toEqual([]);
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    vi.mocked(getPageMeta).mockResolvedValue(null);
  });

  it("returns an empty object when the slug matches no page", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue(null);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: ["yok"] }) });
    expect(meta).toEqual({});
  });

  it("builds metadata from the matched page", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue({
      id: "1",
      title: "Sayfa Başlığı",
      slug: "sayfa",
      layout: [],
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
      parent: undefined,
    } as never);

    const meta = await generateMetadata({ params: Promise.resolve({ slug: ["sayfa"] }) });

    expect(meta.title).toBe("Sayfa Başlığı | Vodafone Pay");
  });

  /**
   * PageMeta names CMS-page addresses in its own help text ("Örn: /,
   * /aninda-bakiye, ..."), but this route used to read SEO only off the Page
   * document, so a published PageMeta row for a CMS page did nothing at all.
   */
  it("falls back to the PageMeta row when the page has no SEO fields of its own", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue({
      id: "1", title: "Sayfa Başlığı", slug: "aninda-bakiye", layout: [],
      seoTitle: undefined, seoDescription: undefined, seoKeywords: undefined, ogImage: undefined, parent: undefined,
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue({
      seoTitle: "Anında Bakiye | Vodafone Pay",
      seoDescription: "Meta açıklaması",
      seoKeywords: undefined, ogImage: undefined,
    } as never);

    const meta = await generateMetadata({ params: Promise.resolve({ slug: ["aninda-bakiye"] }) });

    expect(meta.title).toBe("Anında Bakiye | Vodafone Pay");
    expect(meta.description).toBe("Meta açıklaması");
    expect(vi.mocked(getPageMeta)).toHaveBeenCalledWith("/aninda-bakiye");
  });

  it("keeps the page's own SEO fields ahead of the PageMeta row", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue({
      id: "1", title: "T", slug: "aninda-bakiye", layout: [],
      seoTitle: "Sayfanın kendi başlığı", seoDescription: undefined, seoKeywords: undefined, ogImage: undefined, parent: undefined,
    } as never);
    vi.mocked(getPageMeta).mockResolvedValue({ seoTitle: "PageMeta başlığı" } as never);

    const meta = await generateMetadata({ params: Promise.resolve({ slug: ["aninda-bakiye"] }) });

    expect(meta.title).toBe("Sayfanın kendi başlığı");
  });
});

describe("EditorPage", () => {
  it("calls notFound() when no page matches the slug", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue(null);

    await expect(EditorPage({ params: Promise.resolve({ slug: ["yok"] }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders the Breadcrumb with the page's own title when found, no parent trail", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue({
      id: "1",
      title: "Vodafone Pay Uygulaması",
      slug: "vodafone-pay-uygulama",
      layout: [],
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
      parent: undefined,
    } as never);

    render(await EditorPage({ params: Promise.resolve({ slug: ["vodafone-pay-uygulama"] }) }));

    expect(screen.getByText("Vodafone Pay Uygulaması")).toBeInTheDocument();
  });

  it("adds the parent page as a breadcrumb trail entry when set", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue({
      id: "1",
      title: "Alt Sayfa",
      slug: "alt-sayfa",
      layout: [],
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
      parent: { id: "2", title: "Üst Sayfa", slug: "ust-sayfa" },
    } as never);

    render(await EditorPage({ params: Promise.resolve({ slug: ["alt-sayfa"] }) }));

    const parentLink = screen.getByText("Üst Sayfa").closest("a");
    expect(parentLink).toHaveAttribute("href", "/ust-sayfa");
  });

  it("renders the page's deeplink as a related-link CTA below the layout, and omits it when unset", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue({
      id: "1",
      title: "Sayfa",
      slug: "sayfa",
      layout: [],
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
      parent: undefined,
      deeplink: "/kampanyalar",
    } as never);

    render(await EditorPage({ params: Promise.resolve({ slug: ["sayfa"] }) }));

    const link = screen.getByText("İlgili bağlantı →").closest("a");
    expect(link).toHaveAttribute("href", "/kampanyalar");
  });

  it("omits the related-link CTA when deeplink is unset", async () => {
    vi.mocked(getPageBySlug).mockResolvedValue({
      id: "1",
      title: "Sayfa",
      slug: "sayfa",
      layout: [],
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined,
      ogImage: undefined,
      parent: undefined,
      deeplink: undefined,
    } as never);

    render(await EditorPage({ params: Promise.resolve({ slug: ["sayfa"] }) }));

    expect(screen.queryByText("İlgili bağlantı →")).not.toBeInTheDocument();
  });
});
