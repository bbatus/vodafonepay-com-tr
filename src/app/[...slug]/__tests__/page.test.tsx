import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EditorPage, { generateMetadata, generateStaticParams } from "@/app/[...slug]/page";
import { getPageBySlug, getPages } from "@/lib/cms";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getPageBySlug: vi.fn(), getPages: vi.fn(), getNavLinks: vi.fn() };
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
});
