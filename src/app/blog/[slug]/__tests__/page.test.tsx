import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BlogYazisi, { generateMetadata, generateStaticParams } from "@/app/blog/[slug]/page";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/cms";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
  return { ...actual, getBlogPostBySlug: vi.fn(), getBlogPosts: vi.fn(), getNavLinks: vi.fn() };
});
vi.mock("@/components/Header", () => ({ Header: () => <header>Header</header> }));
vi.mock("@/components/Footer", () => ({ Footer: () => <footer>Footer</footer> }));

const post = {
  id: "1",
  title: "Yeni Yazı",
  slug: "yeni-yazi",
  coverImage: { url: "/a.jpg", alt: "a" },
  body: null,
  category: { label: "Kart", slug: "kart" },
  publishedDate: "2026-07-14",
  seoTitle: undefined,
  seoDescription: undefined,
  seoKeywords: undefined,
  deeplink: "/kampanyalar",
};

describe("generateStaticParams", () => {
  it("maps each blog post to its slug", async () => {
    vi.mocked(getBlogPosts).mockResolvedValue([post] as never);
    expect(await generateStaticParams()).toEqual([{ slug: "yeni-yazi" }]);
  });
});

describe("generateMetadata", () => {
  it("returns an empty object when the slug matches no post", async () => {
    vi.mocked(getBlogPostBySlug).mockResolvedValue(null);
    expect(await generateMetadata({ params: Promise.resolve({ slug: "yok" }) })).toEqual({});
  });
});

describe("BlogYazisi", () => {
  it("calls notFound() when no post matches the slug", async () => {
    vi.mocked(getBlogPostBySlug).mockResolvedValue(null);
    await expect(BlogYazisi({ params: Promise.resolve({ slug: "yok" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the post's title, published date and deeplink", async () => {
    vi.mocked(getBlogPostBySlug).mockResolvedValue(post as never);

    render(await BlogYazisi({ params: Promise.resolve({ slug: "yeni-yazi" }) }));

    expect(screen.getByRole("heading", { name: "Yeni Yazı" })).toBeInTheDocument();
    expect(screen.getByText("İlgili bağlantı →")).toHaveAttribute("href", "/kampanyalar");
  });

  it("omits the deeplink when unset", async () => {
    vi.mocked(getBlogPostBySlug).mockResolvedValue({ ...post, deeplink: undefined } as never);

    render(await BlogYazisi({ params: Promise.resolve({ slug: "yeni-yazi" }) }));

    expect(screen.queryByText("İlgili bağlantı →")).not.toBeInTheDocument();
  });
});
