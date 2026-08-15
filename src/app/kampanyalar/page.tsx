import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { CardListItem } from "@/components/CardListGrid";
import { ContentUnavailable } from "@/components/ContentUnavailable";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getCampaigns, getCategories, getFaqItems, getPageMeta } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { CampaignsFilterableList } from "./CampaignsFilterableList";
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

const fallbackFaqs: FaqItem[] = [
  {
    question: "Vodafone Pay kampanyalarına nasıl katılabilirim?",
    answer:
      "Vodafone Pay Uygulaması üzerinden kampanyaları inceleyerek katılmak istedikleriniz için \"Kampanyaya Katıl\" butonuna tıklayabilir veya kampanya esaslarında yer alan yönlendirmeleri uygulayarak kampanyalara katılabilirsiniz. Hesabını oluşturduktan sonra kampanya şartlarını sağlayarak faydalanabilirsin.",
  },
];

export default async function Kampanyalar() {
  // E3: this page used to fall back to 3+19 hardcoded fake campaigns
  // whenever the CMS was unreachable — that's the actual bug the user
  // reported ("kampanyalar sayfası güncellenmiyor"): the CMS had died, but
  // the page kept silently showing stale placeholder content instead of
  // any visible sign something was wrong. `null` = CMS fetch/parse failed,
  // `[]` = CMS reachable but genuinely has zero campaigns — rendered
  // differently (ContentUnavailable) instead of masked with fake data.
  const [cmsCampaigns, cmsFaqItems, categories] = await Promise.all([
    getCampaigns(),
    getFaqItems("kampanyalar"),
    getCategories(),
  ]);

  const toCard = (c: NonNullable<typeof cmsCampaigns>[number]): CardListItem => ({
    id: c.id,
    image: c.image.url,
    title: c.title,
    description: c.description,
    href: c.ctaUrl || (c.slug ? `/kampanyalar/${c.slug}` : undefined),
    category: c.category?.slug,
    linkLabel: c.ctaLabel,
  });

  const favorites = (cmsCampaigns ?? []).filter((c) => c.featured).map(toCard);
  const allCampaigns = (cmsCampaigns ?? []).filter((c) => !c.featured).map(toCard);
  const faqs: FaqItem[] = cmsFaqItems?.length
    ? cmsFaqItems.map((f) => ({ question: f.question, answer: f.answer }))
    : fallbackFaqs;

  const pageMeta = await getPageMeta("/kampanyalar");

  let content: ReactNode;
  if (cmsCampaigns === null) {
    content = <ContentUnavailable variant="error" />;
  } else if (favorites.length === 0 && allCampaigns.length === 0) {
    content = <ContentUnavailable variant="empty" />;
  } else {
    content = <CampaignsFilterableList favorites={favorites} allCampaigns={allCampaigns} categories={categories ?? []} />;
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
