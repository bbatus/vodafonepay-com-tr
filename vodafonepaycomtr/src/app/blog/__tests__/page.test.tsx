import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Blog from "@/app/blog/page";
import { getBlogPosts, getCategories, getTranslation } from "@/lib/cms";

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return {
    ...actual,
    getBlogPosts: vi.fn(),
    getCategories: vi.fn(),
    getTranslation: vi.fn(),
    getNavLinks: vi.fn(),
  };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

function mockEmpty() {
  vi.mocked(getBlogPosts).mockResolvedValue(null);
  vi.mocked(getCategories).mockResolvedValue(null);
  vi.mocked(getTranslation).mockResolvedValue("Tümü");
}

describe("Blog", () => {
  it("shows the CMS-unreachable error state when getBlogPosts returns null", async () => {
    mockEmpty();
    render(await Blog());
    expect(screen.getByText(/şu anda yüklenemiyor/)).toBeInTheDocument();
  });

  it("shows the genuinely-empty state when the CMS has zero posts", async () => {
    mockEmpty();
    vi.mocked(getBlogPosts).mockResolvedValue([]);
    render(await Blog());
    expect(screen.getByText("Şu anda gösterilecek içerik yok.")).toBeInTheDocument();
  });

  it("renders the filterable post list when posts exist", async () => {
    mockEmpty();
    vi.mocked(getBlogPosts).mockResolvedValue([
      {
        id: "1",
        title: "Yeni Yazı",
        slug: "yeni-yazi",
        coverImage: { url: "/a.jpg", alt: "a" },
        body: null,
        category: { label: "Kart", slug: "kart" },
        publishedDate: undefined,
        seoTitle: undefined,
        seoDescription: undefined,
        seoKeywords: undefined,
        deeplink: undefined,
      },
    ] as never);

    render(await Blog());

    expect(screen.getByText("Yeni Yazı")).toBeInTheDocument();
  });
});
