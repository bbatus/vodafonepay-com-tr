import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ContentUnavailable } from "@/components/ContentUnavailable";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getCampaigns, getCategories, getFaqItems, getPageMeta, getTranslation } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { CampaignsFilterableList, type FilterableCampaign } from "./CampaignsFilterableList";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/kampanyalar");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Nakit İade Kampanyaları | Pay'lilere Özel Fırsatlar | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay'in nakit iade ve indirim kampanyalarını incele, avantajlardan yararlan.",
    path: "/kampanyalar",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function Kampanyalar() {
  // E3: this page used to fall back to 3+19 hardcoded fake campaigns
  // whenever the CMS was unreachable — that's the actual bug the user
  // reported ("kampanyalar sayfası güncellenmiyor"): the CMS had died, but
  // the page kept silently showing stale placeholder content instead of
  // any visible sign something was wrong. `null` = CMS fetch/parse failed,
  // `[]` = CMS reachable but genuinely has zero campaigns — rendered
  // differently (ContentUnavailable) instead of masked with fake data.
  const [cmsCampaigns, cmsFaqItems, categories, allLabel] = await Promise.all([
    getCampaigns(),
    getFaqItems("kampanyalar"),
    getCategories("campaign"),
    getTranslation("filterTabs.all", "Tümü"),
  ]);

  // RFP feedback 5.2: ONE list carrying the `featured` flag, not two
  // pre-split arrays — see CampaignsFilterableList for why the split had to
  // move out of here.
  const campaigns: FilterableCampaign[] = (cmsCampaigns ?? []).map((c) => ({
    id: c.id,
    image: c.image.url,
    title: c.title,
    description: c.description,
    href: c.ctaUrl || (c.slug ? `/kampanyalar/${c.slug}` : undefined),
    category: c.category?.slug,
    linkLabel: c.ctaLabel,
    startDate: c.startDate,
    endDate: c.endDate,
    featured: c.featured,
  }));
  const faqs: FaqItem[] = (cmsFaqItems ?? []).map((f) => ({ question: f.question, answer: f.answer, deeplink: f.deeplink }));

  const pageMeta = await getPageMeta("/kampanyalar");

  let content: ReactNode;
  if (cmsCampaigns === null) {
    content = <ContentUnavailable variant="error" />;
  } else if (campaigns.length === 0) {
    content = <ContentUnavailable variant="empty" />;
  } else {
    content = <CampaignsFilterableList campaigns={campaigns} categories={categories ?? []} allLabel={allLabel} />;
  }

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Kampanyalar"} />

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-20">
        <div className="flex flex-col items-center justify-center lg:pt-8">
          <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Kampanyalar</h1>
        </div>

        {content}
      </section>

      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
