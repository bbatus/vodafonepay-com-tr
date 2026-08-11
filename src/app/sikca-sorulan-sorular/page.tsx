import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getFaqItems } from "@/lib/cms";
import { FaqCategoryFilter } from "./FaqCategoryFilter";

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
