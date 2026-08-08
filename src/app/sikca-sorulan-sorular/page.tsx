import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FaqCategoryFilter } from "./FaqCategoryFilter";

export default function SikcaSorulanSorular() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <FaqCategoryFilter />
      <Footer />
    </main>
  );
}
