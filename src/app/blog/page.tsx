import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import type { CardListItem } from "@/components/CardListGrid";
import { ContentUnavailable } from "@/components/ContentUnavailable";
import { Footer } from "@/components/Footer";
import { getBlogPosts } from "@/lib/cms";
import type { FilterTabCategory } from "@/components/FilterTabs";
import { BlogFilterableList } from "./BlogFilterableList";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Bloglar | Vodafone Pay",
  description: "Vodafone Pay'den mobil ödeme, kart ve dijital cüzdan hakkında güncel blog yazıları.",
  path: "/blog",
});

export default async function Blog() {
  // E3: previously fell back to 12 hardcoded fake posts whenever the CMS
  // was unreachable — same bug class as kampanyalar's fallback (see
  // ContentUnavailable.tsx). `null` = CMS fetch/parse failed, `[]` = CMS
  // reachable but genuinely has zero posts; shown differently so a dead
  // CMS is actually visible instead of silently masked.
  const cmsPosts = await getBlogPosts();
  const posts: CardListItem[] = (cmsPosts ?? []).map((p) => ({
    id: p.id,
    image: p.coverImage.url,
    title: p.title,
    description: p.excerpt,
    href: `/blog/${p.slug}`,
    category: p.category,
  }));

  // This page used to feed `getCategories()` — the CAMPAIGN taxonomy — into
  // its filter tabs. But `BlogPosts.category` is a free-text field, not a
  // relationship to that collection, so the tabs offered campaign categories
  // ("Kart", "Anında Bakiye") that no blog post's category could ever equal:
  // every tab except "Tümü" silently produced an empty list. Confirmed live
  // on a published post. The tabs are derived from the posts' own categories
  // instead, so what's offered always matches what's filterable — and adding
  // a new blog category is just typing it on a post, with no code change and
  // nothing to keep in sync.
  const categories: FilterTabCategory[] = [
    ...new Map(
      posts
        .map((p) => p.category)
        .filter((c): c is string => Boolean(c))
        .map((c) => [c, { label: c, slug: c }])
    ).values(),
  ];

  let content: ReactNode;
  if (cmsPosts === null) {
    content = <ContentUnavailable variant="error" />;
  } else if (posts.length === 0) {
    content = <ContentUnavailable variant="empty" />;
  } else {
    content = <BlogFilterableList posts={posts} categories={categories} />;
  }

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-20">
        <div className="flex flex-col items-center justify-center lg:pt-8">
          <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Blog</h1>
        </div>

        {content}
      </section>

      <Footer />
    </main>
  );
}
