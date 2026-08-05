import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StepPhones } from "@/components/StepPhones";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { Campaigns } from "@/components/Campaigns";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { campaignToCard, getCampaigns, getFaqItems } from "@/lib/cms";

export default async function Home() {
  const [cmsCampaigns, cmsFaqItems] = await Promise.all([getCampaigns(), getFaqItems("anasayfa")]);

  const featuredCampaigns = cmsCampaigns?.filter((c) => c.featured).map(campaignToCard);
  const faqItems = cmsFaqItems?.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <Hero />
      <StepPhones />
      <FeatureHighlights />
      <Campaigns campaigns={featuredCampaigns?.length ? featuredCampaigns : undefined} />
      <Faq items={faqItems?.length ? faqItems : undefined} />
      <Footer />
    </main>
  );
}
