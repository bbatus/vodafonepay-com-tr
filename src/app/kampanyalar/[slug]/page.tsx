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
import { CampaignDate } from "@/components/CampaignDate";
import { getCampaignBySlug, getCampaigns } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";
import { RichText, hasRichTextContent } from "@/components/RichText";

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

        {/* RFP feedback 5.3: was a bare, unlabeled "14.07.2026 – 15.08.2026".
            Now the same labeled block the listing cards use, matching what
            vodafonepay.com.tr itself renders here. */}
        <CampaignDate startDate={campaign.startDate} endDate={campaign.endDate} className="mt-4" />

        {hasRichTextContent(campaign.body) && (
          <div className="mt-8">
            <RichText data={campaign.body} />
          </div>
        )}

        {hasRichTextContent(campaign.terms) && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-black">Kampanya Koşulları</h2>
            <div className="mt-3 text-sm text-gray-600">
              <RichText data={campaign.terms} />
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
