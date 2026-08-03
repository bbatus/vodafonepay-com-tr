import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Hero } from "@/components/Hero";
import { StepPhones } from "@/components/StepPhones";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { Campaigns } from "@/components/Campaigns";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Hero />
      <StepPhones />
      <FeatureHighlights />
      <Campaigns />
      <Faq />
      <Footer />
    </main>
  );
}
