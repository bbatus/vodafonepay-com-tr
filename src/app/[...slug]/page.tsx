import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";
import { Faq } from "@/components/Faq";
import {
  campaignToCard,
  getCampaigns,
  getFaqItems,
  getPageBySlug,
  getPages,
  richTextToParagraphs,
  type CmsPageBlock,
} from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

/**
 * Catch-all for editor-built Pages (RFP §3.3) — next.js resolves any more
 * specific route (/kampanyalar, /blog/[slug], etc.) before falling through
 * to this one, so it can never shadow an existing hand-built page.
 */
export async function generateStaticParams() {
  const pages = await getPages();
  return (pages ?? []).map((p) => ({ slug: p.slug.split("/").filter(Boolean) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug.join("/"));
  if (!page) return {};
  return buildMetadata({
    title: page.seoTitle || `${page.title} | Vodafone Pay`,
    description: page.seoDescription || page.title,
    path: `/${page.slug}`,
    image: page.ogImage?.url,
  });
}

async function BlockRenderer({ block }: { block: CmsPageBlock }) {
  switch (block.blockType) {
    case "hero":
      return (
        <section className="mx-auto max-w-[1030px] px-4 lg:pt-4">
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src={block.image.url}
              alt={block.image.alt || block.heading}
              width={1030}
              height={420}
              priority
              className="h-[240px] w-full object-cover lg:h-[420px]"
            />
          </div>
          <div className="bg-[#f3f4f6] px-6 py-8 text-center">
            <h1 className="text-2xl font-bold text-black lg:text-3xl">{block.heading}</h1>
            {block.subheading && <p className="mt-2 text-base text-gray-600">{block.subheading}</p>}
            {block.ctaLabel && block.ctaUrl && (
              <Link href={block.ctaUrl} className="mt-4 inline-block rounded bg-vf-red px-6 py-3 text-sm font-bold text-white">
                {block.ctaLabel}
              </Link>
            )}
          </div>
        </section>
      );

    case "richText": {
      const paragraphs = richTextToParagraphs(block.body);
      return (
        <section className="mx-auto max-w-3xl px-4 py-10">
          {block.heading && <h2 className="text-2xl font-bold text-black">{block.heading}</h2>}
          <div className="mt-4 space-y-4 text-base text-gray-700">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      );
    }

    case "faqList": {
      const items = await getFaqItems(block.category || undefined);
      return (
        <Faq
          items={(items ?? []).map((f) => ({ question: f.question, answer: f.answer }))}
          showHeading={Boolean(block.heading)}
        />
      );
    }

    case "campaignGrid": {
      const campaigns = await getCampaigns();
      const filtered = block.category ? campaigns?.filter((c) => c.category?.slug === block.category) : campaigns;
      const items: CardListItem[] = (filtered ?? []).map((c) => {
        const card = campaignToCard(c);
        return { image: card.image, title: card.title, description: card.description, href: card.href };
      });
      return (
        <section className="mx-auto w-full max-w-[1280px] px-4 py-10">
          <CardListGrid title={block.heading} items={items} />
        </section>
      );
    }

    case "video":
      return (
        <section className="mx-auto max-w-3xl px-4 py-10">
          {block.heading && <h2 className="text-2xl font-bold text-black">{block.heading}</h2>}
          <div className="mt-4 aspect-video overflow-hidden rounded-lg">
            <iframe
              src={`https://www.youtube.com/embed/${block.youtubeId}`}
              title={block.heading || "Video"}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        </section>
      );

    case "logoGrid":
      return (
        <section className="mx-auto max-w-[1030px] px-4 py-10">
          <div className="rounded-lg bg-white p-6 shadow-[0px_2px_12px_0px_#00000014] lg:p-10">
            {block.heading && <h2 className="text-xl font-bold text-black lg:text-2xl">{block.heading}</h2>}
            <div className="mt-8 grid grid-cols-3 gap-6 sm:grid-cols-5">
              {block.logos.map((l) => {
                const img = (
                  <Image
                    src={l.logo.url}
                    alt={l.logo.alt || l.name}
                    width={80}
                    height={40}
                    className="h-auto max-h-10 w-auto max-w-full object-contain"
                  />
                );
                return (
                  <div key={l.name} className="flex h-16 items-center justify-center">
                    {l.linkUrl ? <Link href={l.linkUrl}>{img}</Link> : img}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
}

export default async function EditorPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug.join("/"));
  if (!page) notFound();

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={page.title} />

      {page.layout.map((block, i) => (
        <BlockRenderer key={block.id ?? i} block={block} />
      ))}

      <Footer />
    </main>
  );
}
