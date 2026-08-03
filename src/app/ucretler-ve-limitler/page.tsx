import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PricesAndLimits } from "@/components/PricesAndLimits";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ücretler ve Limitler | Vodafone Pay",
  description: "Vodafone Pay ürün ve hizmetlerine ait güncel ücret ve limit bilgileri.",
};

export default function UcretlerVeLimitler() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current="Ücretler ve Limitler" />
      <PricesAndLimits />
      <Footer />
    </main>
  );
}
