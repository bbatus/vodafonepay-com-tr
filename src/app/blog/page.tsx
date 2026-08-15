import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import type { CardListItem } from "@/components/CardListGrid";
import { ContentUnavailable } from "@/components/ContentUnavailable";
import { Footer } from "@/components/Footer";
import { getBlogPosts, getCategories } from "@/lib/cms";
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
  const [cmsPosts, categories] = await Promise.all([getBlogPosts(), getCategories()]);
  const posts: CardListItem[] = (cmsPosts ?? []).map((p) => ({
    id: p.id,
    image: p.coverImage.url,
    title: p.title,
    description: p.excerpt,
    href: `/blog/${p.slug}`,
    category: p.category,
  }));

  let content: ReactNode;
  if (cmsPosts === null) {
    content = <ContentUnavailable variant="error" />;
  } else if (posts.length === 0) {
    content = <ContentUnavailable variant="empty" />;
  } else {
    content = <BlogFilterableList posts={posts} categories={categories ?? []} />;
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
