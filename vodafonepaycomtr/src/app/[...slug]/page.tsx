import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";
import { CardsWithIcons } from "@/components/CardsWithIcons";
import { Faq } from "@/components/Faq";
import { PhoneStepsCarousel } from "@/components/PhoneStepsCarousel";
import { ProductHero } from "@/components/ProductHero";
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
    keywords: page.seoKeywords || undefined,
    path: `/${page.slug}`,
    image: page.ogImage?.url,
  });
}

export async function BlockRenderer({ block }: { block: CmsPageBlock }) {
  switch (block.blockType) {
    /**
     * Renders through the same ProductHero the hand-written product pages
     * use, rather than its own copy of the markup. When the product pages
     * were migrated onto Pages, each block was re-implemented from scratch
     * with generic styling, so a CMS-built page and a hand-built one showed
     * visibly different UI for the same section. Sharing the component is
     * what keeps them identical — and pins both to the live site's layout.
     */
    case "hero":
      return (
        <ProductHero
          image={block.image.url}
          imageAlt={block.image.alt || block.heading}
          heading={block.heading}
          subheading={block.subheading}
          ctaLabel={block.ctaLabel}
          ctaUrl={block.ctaUrl}
        />
      );

    case "richText":
      // Live section headings are left-aligned `text-2xl lg:text-4xl` in the
      // bold Vodafone face, on the same 1030px column as every other section
      // — not a narrower max-w-3xl block with a smaller heading.
      return (
        <section className="mx-auto w-full max-w-[1030px] px-4 py-10">
          {block.heading && <h2 className="text-2xl font-bold text-black lg:text-4xl">{block.heading}</h2>}
          <div className="mt-4">
            <RichText data={block.body} />
          </div>
        </section>
      );

    case "faqList": {
      const items = await getFaqItems(block.category || undefined);
      return (
        <Faq
          items={(items ?? []).map((f) => ({ question: f.question, answer: f.answer, deeplink: f.deeplink }))}
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
      // 1030px, not 1280px: every other section on a product page sits on the
      // live site's own content column, and the wider one made this block
      // visibly overhang its neighbours.
      return (
        <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
          <CardListGrid title={block.heading} items={items} />
        </section>
      );
    }

    case "video":
      return (
        <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
          {block.heading && <h2 className="text-2xl font-bold text-black lg:text-4xl">{block.heading}</h2>}
          <div className="mt-8 aspect-video overflow-hidden rounded-xl">
            <iframe
              src={`https://www.youtube.com/embed/${block.youtubeId}`}
              title={block.heading || "Video"}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        </section>
      );

    // The site's own surface treatment is a flat #F2F2F2 tile (`bg-vf-gray`),
    // never a white card on a white page with a drop shadow — see
    // VideosWithTabs/CardsWithIcons, both built against the live design.
    case "logoGrid":
      return (
        <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
          {block.heading && <h2 className="text-2xl font-bold text-black lg:text-4xl">{block.heading}</h2>}
          <div className="mt-8 rounded-xl bg-vf-gray p-6 lg:p-10">
            <div className="grid grid-cols-3 items-center gap-6 sm:grid-cols-5">
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

    /**
     * Same reasoning as `hero`: the live cards are flat `#F2F2F2` tiles with
     * a red 28px title, which CardsWithIcons already reproduces exactly. The
     * block used to draw white shadowed cards with a black 16px title —
     * nothing on vodafonepay.com.tr looks like that.
     */
    case "iconCards":
      return (
        <CardsWithIcons
          title={block.heading}
          cards={block.cards.map((c) => ({ icon: c.icon.url, title: c.title, text: c.text }))}
        />
      );

    /**
     * The live "Nasıl kullanırım?" section is a phone carousel: two columns
     * of `h-[226px] rounded-xl` step boxes flanking one large phone
     * screenshot, the active box filled Vodafone red. PhoneStepsCarousel is
     * the component that was built against it — it was deleted during the
     * Pages migration and restored here, because the block's stand-in (small
     * red number badges beside 160px thumbnails) shared none of that design.
     */
    case "steps":
      return (
        <PhoneStepsCarousel
          heading={block.heading ?? ""}
          steps={block.steps.map((s) => ({ number: s.number, text: s.text, image: s.image.url }))}
        />
      );

    // Mirrors VideosWithTabs' own scroller: fixed-width `bg-vf-gray rounded-xl`
    // tiles with the media inset, rather than white shadowed cards.
    case "imageTextSlides":
      return (
        <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
          {block.heading && <h2 className="text-2xl font-bold text-black lg:text-4xl">{block.heading}</h2>}
          <div className="mt-8 flex gap-x-5 overflow-x-auto pb-2">
            {block.slides.map((s) => (
              <div key={s.image.url} className="flex w-[253px] shrink-0 flex-col gap-y-3 rounded-xl bg-vf-gray p-4">
                <Image
                  src={s.image.url}
                  alt={s.image.alt || s.text}
                  width={253}
                  height={160}
                  className="h-40 w-full rounded-lg object-cover"
                />
                <p className="text-base text-black">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "videoList":
      return (
        <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
          {block.heading && <h2 className="text-2xl font-bold text-black lg:text-4xl">{block.heading}</h2>}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {block.videos.map((v) => (
              <div key={v.youtubeId} className="flex flex-col gap-y-3 rounded-xl bg-vf-gray p-4">
                <div className="aspect-video overflow-hidden rounded-lg">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                    title={v.title}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
                <p className="text-center text-base font-bold text-black">{v.title}</p>
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
      <Breadcrumb current={page.title} trail={page.parent ? [{ label: page.parent.title, href: `/${page.parent.slug}` }] : undefined} />

      {page.layout.map((block) => (
        <BlockRenderer key={block.id ?? JSON.stringify(block)} block={block} />
      ))}

      <Footer />
    </main>
  );
}
