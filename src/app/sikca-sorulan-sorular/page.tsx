import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCategories, getFaqItems, getPageMeta, getTranslation } from "@/lib/cms";
import type { FilterTabCategory } from "@/components/FilterTabs";
import { FaqCategoryFilter } from "./FaqCategoryFilter";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/sikca-sorulan-sorular");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Sıkça Sorulan Sorular | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay hakkında en çok merak edilen sorular ve cevapları.",
    path: "/sikca-sorulan-sorular",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function SikcaSorulanSorular() {
  const [cmsFaqItems, cmsCategories, allLabel] = await Promise.all([
    getFaqItems(),
    getCategories("faq"),
    getTranslation("filterTabs.all", "Tümü"),
  ]);

  const items = (cmsFaqItems ?? []).map((f) => ({
    question: f.question,
    answer: f.answer,
    category: f.category?.slug,
  }));

  // FaqItems.category is now the same Categories relationship Campaigns/
  // BlogPosts use (RFP feedback 1.3) — creating a category in the CMS
  // (Akış: Sık Sorulan Sorular) is what makes a new
  // /sikca-sorulan-sorular?kategori=<slug> tab exist. No code change.
  //
  // Every FAQ-scope category gets a tab, even with zero questions in it
  // yet — an editor who just created "Duyurular" needs to SEE the empty tab
  // to know it worked, not have it silently stay invisible until the first
  // question is filed. FaqCategoryFilter shows an explicit empty state for
  // a tab with no items instead of a blank content area.
  const categories: FilterTabCategory[] = (cmsCategories ?? []).map((c) => ({ label: c.label, slug: c.slug }));

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <FaqCategoryFilter items={items.length ? items : undefined} categories={categories} allLabel={allLabel} />
      <Footer />
    </main>
  );
}
