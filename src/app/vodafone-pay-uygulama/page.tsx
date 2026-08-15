import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductHero } from "@/components/ProductHero";
import { AppFeatures } from "@/components/AppFeatures";
import { HowToEarn } from "@/components/HowToEarn";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getContentBlocks, getFaqItems, getPageMeta, getProductHero } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/vodafone-pay-uygulama");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Vodafone Pay Uygulaması ve Avantajları | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay Uygulaması'nı indirerek tüm harcamalarınızı kolayca takip edebilir, kazandıran kampanyalara katılabilirsiniz.",
    path: "/vodafone-pay-uygulama",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function VodafonePayUygulama() {
  const [cmsFaqItems, cmsHero, cmsSlides, cmsEarnSteps] = await Promise.all([
    getFaqItems("vodafone-pay-uygulama"),
    getProductHero("vodafone-pay-uygulama"),
    getContentBlocks("uygulama-ayricalikli"),
    getContentBlocks("uygulama-nasil-kazanirim"),
  ]);
  // RFP feedback 5.0: no hardcoded FAQ fallback — an empty CMS result renders
  // no FAQ section at all rather than copy nobody can edit.
  const faqs: FaqItem[] = (cmsFaqItems ?? []).map((f) => ({ question: f.question, answer: f.answer }));
  // RFP feedback 5.0: content-blocks ARE seeded for this page, so the old
  // `: undefined` branch only ever fired on a CMS failure — where it made the
  // component fall back to hardcoded copy. Empty now means the section is
  // simply not rendered.
  const slides = (cmsSlides ?? []).map((s) => ({ image: s.image?.url ?? "", text: s.text ?? "" }));
  const earnSteps = cmsEarnSteps?.length
    ? cmsEarnSteps.map((s) => ({ icon: s.image?.url ?? "", title: s.title ?? "", description: s.text ?? "" }))
    : undefined;

  const pageMeta = await getPageMeta("/vodafone-pay-uygulama");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Vodafone Pay Uygulama"} />
      <ProductHero
        image={cmsHero?.image.url ?? "/images/uygulama-hero.jpg"}
        imageAlt={cmsHero?.image.alt || "Vodafone Pay Uygulaması"}
        heading={cmsHero?.heading ?? "Vodafone Pay Uygulaması'nı indir"}
      />
      <AppFeatures slides={slides} />
      <HowToEarn
        heading="Vodafone Pay ile Nasıl Kazanırım?"
        image="/images/step-nasil-kazanirim.png"
        steps={
          earnSteps ?? [
            {
              icon: "/images/icon-bakiye-yukle.svg",
              title: "Bakiye Yükle",
              description: "Banka/kredi kartınızdan, EFT ile veya tüm ATM'lerden dilediğiniz kadar bakiye yükleyin.",
            },
            {
              icon: "/images/icon-harca.svg",
              title: "Harca",
              description: "Tüm online ve fiziksel alışverişlerinizi Vodafone Pay Kart ile yapabilirsiniz.",
            },
            {
              icon: "/images/icon-kazan.png",
              title: "Kazan",
              description: "Kampanya kapsamında yaptığınız tüm harcamalardan yüzlerce TL nakit iade kazanın!",
            },
          ]
        }
      />
      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
