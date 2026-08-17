import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StepPhones } from "@/components/StepPhones";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { Campaigns } from "@/components/Campaigns";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { campaignToCard, getCampaigns, getContentBlocks, getFaqItems, getPageMeta } from "@/lib/cms";
import type { StepProduct } from "@/types/homepage";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Vodafone Pay | Yeni Nesil Mobil Cüzdan",
    description:
      pageMeta?.seoDescription ||
      "Vodafone Pay ile cüzdanınıza bakış açınız kökten değişiyor, hazır mısınız? Vodafone Pay hakkında detaylı bilgi almak için tıklayın.",
    path: "/",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function Home() {
  const [cmsCampaigns, cmsFaqItems, cmsSteps, cmsHighlights] = await Promise.all([
    getCampaigns(),
    getFaqItems("anasayfa"),
    getContentBlocks("anasayfa-steps"),
    getContentBlocks("anasayfa-highlights"),
  ]);

  // RFP feedback 5.0: every one of these used to degrade to `undefined` so the
  // component would substitute its own hardcoded copy — the homepage rendered
  // identically whether the CMS was healthy or dead. Now an empty CMS result
  // stays empty and the section simply doesn't render.
  const featuredCampaigns = (cmsCampaigns ?? []).filter((c) => c.featured).map(campaignToCard);
  const faqItems = (cmsFaqItems ?? []).map((f) => ({ question: f.question, answer: f.answer }));
  const steps: StepProduct[] = (cmsSteps ?? []).map((s) => ({
    title: s.title ?? "",
    description: s.text ?? "",
    image: s.image?.url ?? "",
    imageAlt: s.image?.alt || s.title || "",
  }));
  const highlights = (cmsHighlights ?? []).map((h) => ({
    icon: h.image?.url ?? "",
    title: h.title ?? "",
    description: h.text ?? "",
  }));

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <Hero />
      <StepPhones steps={steps} />
      <FeatureHighlights features={highlights} />
      <Campaigns campaigns={featuredCampaigns} />
      <Faq items={faqItems} />
      <Footer />
    </main>
  );
}
