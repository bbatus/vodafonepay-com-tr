import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import type { CardListItem } from "@/components/CardListGrid";
import { ContentUnavailable } from "@/components/ContentUnavailable";
import { Footer } from "@/components/Footer";
import { getBlogPosts, getCategories } from "@/lib/cms";
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
  const [cmsPosts, cmsCategories] = await Promise.all([getBlogPosts(), getCategories()]);
  const posts: CardListItem[] = (cmsPosts ?? []).map((p) => ({
    id: p.id,
    image: p.coverImage.url,
    title: p.title,
    description: p.excerpt,
    href: `/blog/${p.slug}`,
    category: p.category?.slug,
  }));

  // The live vodafonepay.com.tr blog filters by the SAME taxonomy as
  // campaigns (Anında Bakiye / Faturana Yansıt / Kart), which is why
  // BlogPosts.category is now a relationship to Categories rather than free
  // text. Feeding the tabs from that collection only works BECAUSE of that
  // change — while the field was free text this exact wiring offered
  // categories no post could ever match, so every tab but "Tümü" came up
  // empty. Only categories that actually have a post are shown, so the page
  // never offers a tab that leads nowhere.
  const usedSlugs = new Set(posts.map((p) => p.category).filter(Boolean));
  const categories: FilterTabCategory[] = (cmsCategories ?? [])
    .filter((c) => usedSlugs.has(c.slug))
    .map((c) => ({ label: c.label, slug: c.slug }));

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
