import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import type { CardListItem } from "@/components/CardListGrid";
import { ContentUnavailable } from "@/components/ContentUnavailable";
import { Footer } from "@/components/Footer";
import { getBlogPosts, getCategories, getTranslation, richTextToPlainText } from "@/lib/cms";
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
  const [cmsPosts, cmsCategories, allLabel] = await Promise.all([
    getBlogPosts(),
    getCategories("blog"),
    getTranslation("filterTabs.all", "Tümü"),
  ]);
  const posts: CardListItem[] = (cmsPosts ?? []).map((p) => ({
    id: p.id,
    image: p.coverImage.url,
    title: p.title,
    description: richTextToPlainText(p.body, 140),
    href: `/blog/${p.slug}`,
    category: p.category?.slug,
    linkLabel: p.ctaLabel,
  }));

  // Consistent with /sikca-sorulan-sorular (RFP follow-up): every Blog-scope
  // category is a tab, even with zero posts in it yet — an editor who just
  // created a category needs to see it appear, not wonder whether it worked.
  // BlogFilterableList shows an explicit empty state for a tab with no posts.
  const categories: FilterTabCategory[] = (cmsCategories ?? []).map((c) => ({ label: c.label, slug: c.slug }));

  let content: ReactNode;
  if (cmsPosts === null) {
    content = <ContentUnavailable variant="error" />;
  } else if (posts.length === 0) {
    content = <ContentUnavailable variant="empty" />;
  } else {
    content = <BlogFilterableList posts={posts} categories={categories} allLabel={allLabel} />;
  }

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />

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
