import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductHero } from "@/components/ProductHero";
import { EarnWithCard } from "@/components/EarnWithCard";
import { WhereCanIBuy } from "@/components/WhereCanIBuy";
import { VideoGuideSection } from "@/components/VideoGuideSection";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getContentBlocks, getFaqItems, getPageMeta, getProductHero } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/vodafone-pay-kart");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Vodafone Pay Kart",
    description: pageMeta?.seoDescription || "Vodafone Pay Sanal ve Fiziksel Kart ile harcamalarını kolayca ve güvenli bir şekilde gerçekleştirebilir, kazandığın nakit iadelerle daha fazla harcayabilirsin.",
    keywords: pageMeta?.seoKeywords || undefined,
    path: "/vodafone-pay-kart",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function VodafonePayKart() {
  const [cmsFaqItems, cmsHero, cmsSlides, cmsVideos] = await Promise.all([
    getFaqItems("vodafone-pay-kart"),
    getProductHero("vodafone-pay-kart"),
    getContentBlocks("kart-earn"),
    getContentBlocks("kart-video-guide"),
  ]);
  // RFP feedback 5.0: faq-items and content-blocks are both seeded for this
  // page, so these fallbacks only ever fired on a CMS failure — masking it.
  // An empty result now renders no section instead of hardcoded copy.
  const faqs: FaqItem[] = (cmsFaqItems ?? []).map((f) => ({ question: f.question, answer: f.answer, deeplink: f.deeplink }));
  const slides = (cmsSlides ?? []).map((s) => ({ image: s.image?.url ?? "", text: s.text ?? "" }));
  const videos = (cmsVideos ?? []).map((v) => ({ title: v.title ?? "", youtubeId: v.youtubeId ?? "" }));

  const pageMeta = await getPageMeta("/vodafone-pay-kart");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Vodafone Pay Kart"} />
      <ProductHero
        image={cmsHero?.image.url ?? "/images/kart-hero.jpg"}
        imageAlt={cmsHero?.image.alt || "Vodafone Pay Kart"}
        heading={cmsHero?.heading ?? "Vodafone Pay Kart ile dilediğin yerde harca, kazan"}
      />
      <EarnWithCard slides={slides} />
      <WhereCanIBuy />
      <VideoGuideSection videos={videos} />
      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
