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

  const featuredCampaigns = cmsCampaigns?.filter((c) => c.featured).map(campaignToCard);
  const faqItems = cmsFaqItems?.map((f) => ({ question: f.question, answer: f.answer }));
  const steps: StepProduct[] | undefined = cmsSteps?.length
    ? cmsSteps.map((s) => ({
        title: s.title ?? "",
        description: s.text ?? "",
        image: s.image?.url ?? "",
        imageAlt: s.image?.alt || s.title || "",
      }))
    : undefined;
  const highlights = cmsHighlights?.length
    ? cmsHighlights.map((h) => ({ icon: h.image?.url ?? "", title: h.title ?? "", description: h.text ?? "" }))
    : undefined;

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <Hero />
      <StepPhones steps={steps} />
      <FeatureHighlights features={highlights} />
      <Campaigns campaigns={featuredCampaigns?.length ? featuredCampaigns : undefined} />
      <Faq items={faqItems?.length ? faqItems : undefined} />
      <Footer />
    </main>
  );
}
