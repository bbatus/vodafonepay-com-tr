import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import Image from "next/image";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { PreviewBanner } from "@/components/PreviewBanner";
import { getCampaignBySlug, getCampaigns, richTextToParagraphs } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export async function generateStaticParams() {
  const campaigns = await getCampaigns();
  return (campaigns ?? [])
    .filter((c): c is typeof c & { slug: string } => Boolean(c.slug))
    .map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return {};
  return buildMetadata({
    title: campaign.seoTitle || `${campaign.title} | Vodafone Pay`,
    description: campaign.seoDescription || campaign.description,
    path: `/kampanyalar/${campaign.slug}`,
    image: campaign.image.url,
  });
}

export default async function KampanyaDetay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { isEnabled: isPreview } = await draftMode();
  const campaign = await getCampaignBySlug(slug, { preview: isPreview });
  if (!campaign) notFound();

  const bodyParagraphs = richTextToParagraphs(campaign.body);
  const termsParagraphs = richTextToParagraphs(campaign.terms);

  return (
    <main className="flex min-h-screen flex-col">
      {isPreview && <PreviewBanner path={`/kampanyalar/${slug}`} />}
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={campaign.title} />

      <section className="mx-auto w-full max-w-[840px] px-4 pb-20">
        <Image
          src={campaign.image.url}
          alt={campaign.image.alt || campaign.title}
          width={840}
          height={420}
          className="h-auto w-full rounded-md object-cover"
        />
        <h1 className="mt-6 text-[32px] font-light leading-[40px] text-black">{campaign.title}</h1>
        <p className="mt-4 text-base text-gray-700">{campaign.description}</p>

        {(campaign.startDate || campaign.endDate) && (
          <p className="mt-2 text-sm text-gray-500">
            {campaign.startDate && new Date(campaign.startDate).toLocaleDateString("tr-TR")}
            {campaign.startDate && campaign.endDate && " – "}
            {campaign.endDate && new Date(campaign.endDate).toLocaleDateString("tr-TR")}
          </p>
        )}

        {bodyParagraphs.length > 0 && (
          <div className="mt-8 space-y-4 text-base text-gray-700">
            {bodyParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {termsParagraphs.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-black">Kampanya Koşulları</h2>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              {termsParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
