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
import { campaignToCard, getCampaigns, getFaqItems, getPageBySlug, getPages, type CmsPageBlock } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";
import { RichText } from "@/components/RichText";

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

    case "richText":
      return (
        <section className="mx-auto max-w-3xl px-4 py-10">
          {block.heading && <h2 className="text-2xl font-bold text-black">{block.heading}</h2>}
          <div className="mt-4">
            <RichText data={block.body} />
          </div>
        </section>
      );

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
        return { id: card.id, image: card.image, title: card.title, description: card.description, href: card.href };
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

    case "iconCards":
      return (
        <section className="mx-auto max-w-[1030px] px-4 py-10">
          {block.heading && <h2 className="text-center text-2xl font-bold text-black lg:text-3xl">{block.heading}</h2>}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {block.cards.map((c) => (
              <div key={c.title} className="rounded-lg bg-white p-6 text-center shadow-[0px_2px_12px_0px_#00000014]">
                <Image src={c.icon.url} alt={c.icon.alt || c.title} width={48} height={48} className="mx-auto h-12 w-12 object-contain" />
                <h3 className="mt-4 text-base font-bold text-black">{c.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{c.text}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "steps":
      return (
        <section className="mx-auto max-w-3xl px-4 py-10">
          {block.heading && <h2 className="text-center text-2xl font-bold text-black lg:text-3xl">{block.heading}</h2>}
          <ol className="mt-8 flex flex-col gap-8">
            {block.steps.map((s) => (
              <li key={s.number} className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vf-red text-sm font-bold text-white">
                  {s.number}
                </span>
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <Image src={s.image.url} alt={s.image.alt || s.text} width={200} height={360} className="h-auto w-40 rounded-lg object-cover" />
                  <p className="text-center text-sm text-gray-700 sm:text-left">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      );

    case "imageTextSlides":
      return (
        <section className="mx-auto max-w-[1030px] px-4 py-10">
          {block.heading && <h2 className="text-center text-2xl font-bold text-black lg:text-3xl">{block.heading}</h2>}
          <div className="mt-8 flex gap-6 overflow-x-auto pb-2">
            {block.slides.map((s, i) => (
              <div key={i} className="w-64 shrink-0 rounded-lg bg-white shadow-[0px_2px_12px_0px_#00000014]">
                <Image src={s.image.url} alt={s.image.alt || s.text} width={256} height={160} className="h-40 w-full rounded-t-lg object-cover" />
                <p className="p-4 text-sm text-gray-700">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "videoList":
      return (
        <section className="mx-auto max-w-3xl px-4 py-10">
          {block.heading && <h2 className="text-2xl font-bold text-black">{block.heading}</h2>}
          <div className="mt-4 flex flex-col gap-8">
            {block.videos.map((v) => (
              <div key={v.youtubeId}>
                <h3 className="mb-2 text-sm font-bold text-black">{v.title}</h3>
                <div className="aspect-video overflow-hidden rounded-lg">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                    title={v.title}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
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
      <Breadcrumb current={page.title} trail={page.parent ? [{ label: page.parent.title, href: `/${page.parent.slug}` }] : undefined} />

      {page.layout.map((block) => (
        <BlockRenderer key={block.id ?? JSON.stringify(block)} block={block} />
      ))}

      <Footer />
    </main>
  );
}
