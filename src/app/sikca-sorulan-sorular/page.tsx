import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getFaqItems, getPageMeta } from "@/lib/cms";
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
  const cmsFaqItems = await getFaqItems();

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <FaqCategoryFilter
        items={cmsFaqItems?.length ? cmsFaqItems.map((f) => ({ question: f.question, answer: f.answer, category: f.category })) : undefined}
      />
      <Footer />
    </main>
  );
}
