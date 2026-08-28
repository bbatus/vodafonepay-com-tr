import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StepPhones } from "@/components/StepPhones";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { Campaigns } from "@/components/Campaigns";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { campaignToCard, getCampaigns, getContentBlocks, getHomepageFaqItems, getPageBySlug, getPageMeta } from "@/lib/cms";
import { BlockRenderer } from "@/app/[...slug]/page";
import type { StepProduct } from "@/types/homepage";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Vodafone Pay | Yeni Nesil Mobil Cüzdan",
    description:
      pageMeta?.seoDescription ||
      "Vodafone Pay ile cüzdanınıza bakış açınız kökten değişiyor, hazır mısınız? Vodafone Pay hakkında detaylı bilgi almak için tıklayın.",
    keywords: pageMeta?.seoKeywords || undefined,
    path: "/",
    image: pageMeta?.ogImage?.url,
  });
}

/**
 * The slug an editor gives a Pages document to take over the homepage.
 * Publishing a page at this slug makes `/` render THAT page's blocks instead
 * of the composition below — the RFP's "every page manageable from the CMS"
 * asked for the homepage too, and it was the one page still assembled in code.
 *
 * Kept as an opt-in rather than a migration: the hardcoded composition stays
 * as the fallback, so the homepage cannot break just because the CMS is
 * unreachable or the page is unpublished. Delete the Pages document and `/`
 * goes straight back to the code path.
 *
 * `/` never reaches the [...slug] catch-all (Next resolves this static route
 * first), so the page has to be read here explicitly.
 */
const HOMEPAGE_SLUG = "anasayfa";

export default async function Home() {
  const cmsHomepage = await getPageBySlug(HOMEPAGE_SLUG);
  if (cmsHomepage && cmsHomepage.layout.length > 0) {
    return (
      <main className="flex min-h-screen flex-col">
        <AppDownloadBanner />
        <Header />
        {cmsHomepage.layout.map((block) => (
          <BlockRenderer key={block.id ?? JSON.stringify(block)} block={block} />
        ))}
        <Footer />
      </main>
    );
  }

  const [cmsCampaigns, cmsFaqItems, cmsSteps, cmsHighlights] = await Promise.all([
    getCampaigns(),
    getHomepageFaqItems(),
    getContentBlocks("anasayfa-steps"),
    getContentBlocks("anasayfa-highlights"),
  ]);

  // RFP feedback 5.0: every one of these used to degrade to `undefined` so the
  // component would substitute its own hardcoded copy — the homepage rendered
  // identically whether the CMS was healthy or dead. Now an empty CMS result
  // stays empty and the section simply doesn't render.
  const featuredCampaigns = (cmsCampaigns ?? []).filter((c) => c.featured).map(campaignToCard);
  const faqItems = (cmsFaqItems ?? []).map((f) => ({ question: f.question, answer: f.answer, deeplink: f.deeplink }));
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
