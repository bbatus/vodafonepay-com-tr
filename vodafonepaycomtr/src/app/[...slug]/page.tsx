import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";
import { BrandLogoGrid } from "@/components/BrandLogoGrid";
import { CardsWithIcons } from "@/components/CardsWithIcons";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { Faq } from "@/components/Faq";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { HowToEarn } from "@/components/HowToEarn";
import { ContactInfoPanel } from "@/components/ContactInfoPanel";
import { MediaPanel } from "@/components/MediaPanel";
import { ProfileGrid } from "@/components/ProfileGrid";
import { StepPhones } from "@/components/StepPhones";
import { RepresentativeList } from "@/components/RepresentativeList";
import { ImageWithText } from "@/components/ImageWithText";
import { PricesAndLimits } from "@/components/PricesAndLimits";
import { PhoneStepsCarousel } from "@/components/PhoneStepsCarousel";
import { ProductHero } from "@/components/ProductHero";
import { ImageSideCarousel } from "@/components/ImageSideCarousel";
import { VideosWithTabs } from "@/components/VideosWithTabs";
import { LeadFormCta } from "@/components/LeadFormCta";
import {
  campaignToCard,
  getBlogPosts,
  getCampaigns,
  getFaqItems,
  getContactInfo,
  getFeeRows,
  getLimitTables,
  getPageBySlug,
  getPageMeta,
  getPages,
  getRepresentatives,
  richTextToPlainText,
  type CmsPageBlock,
} from "@/lib/cms";
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

/**
 * Found in the 28.08 walkthrough: PageMeta advertises itself with the example
 * "Örn: /, /aninda-bakiye, /kampanyalar" — and `/aninda-bakiye` is a CMS Page,
 * not one of the hand-written routes. An editor could create, publish, and
 * verify a PageMeta row for a CMS page and nothing whatsoever would change,
 * because this route read SEO only off the Page document. PageMeta is now the
 * fallback: the Page's own fields still win where they are filled, so nothing
 * that worked before changes, but the collection's promise finally holds for
 * every address it names.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const [page, meta] = await Promise.all([getPageBySlug(slug.join("/")), getPageMeta(path)]);
  if (!page) return {};
  return buildMetadata({
    title: page.seoTitle || meta?.seoTitle || `${page.title} | Vodafone Pay`,
    description: page.seoDescription || meta?.seoDescription || page.title,
    keywords: page.seoKeywords || meta?.seoKeywords || undefined,
    path: `/${page.slug}`,
    image: page.ogImage?.url ?? meta?.ogImage?.url,
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

    /**
     * Live parity: `widget_WhereCanIUse`. This block used to draw its own
     * 80x40 logos in a grey tile with no brand names at all — measuring the
     * live widget showed 140x140 transparent tiles WITH the brand name under
     * each, inside a 1400px white card. BrandLogoGrid now carries that, and
     * the block renders through it so /faturana-yansit and an editor-built
     * page stay identical.
     */
    case "logoGrid":
      return (
        <BrandLogoGrid
          heading={block.heading || undefined}
          brands={block.logos.map((l) => ({ name: l.name, logo: l.logo.url, linkUrl: l.linkUrl }))}
        />
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
          description={block.description}
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

    /**
     * Live parity gap: `widget_VpayApp_NasilKazanirim` runs on two live
     * product pages and had no block equivalent, so the block library could
     * not rebuild those pages. HowToEarn already renders that exact layout
     * for the hand-written pages, so the block just feeds it.
     */
    case "howToEarn":
      return (
        <HowToEarn
          heading={block.heading}
          image={block.image.url}
          steps={block.steps.map((s) => ({ icon: s.icon.url, title: s.title, description: s.description }))}
          invertIcons={false}
        />
      );

    /**
     * Live parity: `widget_WhereCanIBuy` / `widget_WhereCanIUse`. Renders
     * through the same ImageWithText the hand-written /vodafone-pay-kart page
     * now uses, so the two can't diverge.
     */
    case "imageWithText":
      return (
        <ImageWithText
          heading={block.heading}
          text={block.text}
          image={block.image.url}
          imageAlt={block.image.alt || block.heading}
          imageSide={block.imageSide}
        />
      );

    /**
     * Live parity: `widget_PricesAndLimits`. Reads the Fee Rows / Limit Tables
     * collections rather than carrying its own copy of the numbers — an
     * editor edits them in one place and every page showing this block
     * follows. Renders nothing at all if both are empty, instead of an empty
     * table shell (the fallback-masking rule: show the real state).
     */
    case "pricesAndLimits": {
      const [feeRows, limitTables] = await Promise.all([getFeeRows(), getLimitTables()]);
      if (!feeRows?.length && !limitTables?.length) return null;
      return (
        <PricesAndLimits
          feeRows={(feeRows ?? []).map((r) => [r.label, r.value] as [string, string])}
          limitTables={(limitTables ?? []).map((t) => ({
            title: t.title,
            rows: t.rows.map(
              (r) => [r.category, r.period, r.unverifiedLimit, r.verifiedLimit] as [string, string, string, string]
            ),
          }))}
        />
      );
    }

    /** Live parity: `widget_Blogs` — same grid as campaignGrid, fed from Blog Posts. */
    case "blogGrid": {
      const posts = await getBlogPosts();
      const filtered = block.category ? posts?.filter((p) => p.category?.slug === block.category) : posts;
      const items: CardListItem[] = (filtered ?? []).map((p) => ({
        id: p.id,
        image: p.coverImage.url,
        title: p.title,
        description: richTextToPlainText(p.body, 120),
        href: `/blog/${p.slug}`,
      }));
      return (
        <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
          <CardListGrid title={block.heading} items={items} />
        </section>
      );
    }

    /** Live parity: `widget_Homepage_VpayAyricaliklarDunyasi`. */
    case "featureHighlights":
      return (
        <FeatureHighlights
          heading={block.heading}
          media={block.media}
          features={block.features.map((f) => ({ icon: f.icon.url, title: f.title, description: f.description }))}
        />
      );

    /** Live parity: `widget_Homepage_VpayStepPhones`. */
    case "stepPhones":
      return (
        <StepPhones
          heading={block.heading}
          description={block.description}
          steps={block.steps.map((s) => ({ title: s.title, description: s.description, image: s.image.url, imageAlt: s.image.alt || s.title }))}
        />
      );

    /** Live parity: `widget_PhysicalCardUsed`. */
    case "mediaPanel":
      return (
        <MediaPanel
          heading={block.heading}
          text={block.text}
          backgroundImage={block.backgroundImage.url}
          youtubeId={block.youtubeId}
        />
      );

    /** Live parity: `widget_FooterPages\ContactInfo` — reads the global. */
    case "contactInfo": {
      const info = await getContactInfo();
      if (!info) return null;
      return <ContactInfoPanel info={info} heading={block.heading} />;
    }

    /** Live parity: `widget_Representatives` — reads the collection. */
    case "representatives": {
      const reps = await getRepresentatives();
      if (!reps?.length) return null;
      return <RepresentativeList representatives={reps} heading={block.heading} limit={block.limit} />;
    }

    /** Live parity: `widget_BoardOfDirectors`. */
    case "profileGrid":
      return (
        <ProfileGrid
          heading={block.heading}
          people={block.people.map((p) => ({ photo: p.photo.url, name: p.name, title: p.title }))}
        />
      );

    // Mirrors VideosWithTabs' own scroller: fixed-width `bg-vf-gray rounded-xl`
    // tiles with the media inset, rather than white shadowed cards.
    // `sideImage` set → the fixed-image + one-slide-at-a-time carousel layout
    // (live parity: `widget_EarnWithCard`'s "Kartla Kazan" pairing, migrated
    // from the hand-written /vodafone-pay-kart page — see ImageSideCarousel.tsx).
    // Unset → the original horizontal scroller, unchanged for any existing use.
    case "imageTextSlides":
      if (block.sideImage) {
        return (
          <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
            {block.heading && <h2 className="text-2xl font-bold text-black lg:text-4xl">{block.heading}</h2>}
            {block.intro && <p className="mt-4 max-w-2xl text-base text-gray-600">{block.intro}</p>}
            <ImageSideCarousel
              sideImage={block.sideImage.url}
              sideImageAlt={block.sideImage.alt || block.heading || ""}
              slides={block.slides.map((s) => ({ image: s.image.url, text: s.text }))}
            />
          </section>
        );
      }
      return (
        <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
          {block.heading && <h2 className="text-2xl font-bold text-black lg:text-4xl">{block.heading}</h2>}
          {/* One `#F2F2F2 rounded-md` panel holding the slides, matching the
              live `widget_EarnWithCard` surface — the live site never puts a
              row of separately-tinted tiles straight onto the white page. */}
          <div className="mt-8 flex gap-x-5 overflow-x-auto rounded-md bg-vf-gray p-4 lg:p-9">
            {block.slides.map((s) => (
              <div key={s.image.url} className="flex w-[253px] shrink-0 flex-col gap-y-3">
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

    // `darkBackgroundImage` set → the dark full-bleed panel (live parity:
    // hand-written /vodafone-pay-kart's "Fiziksel Kart nerelerde kullanılır?"
    // section — see VideoGuideSection.tsx). Unset → the original light card
    // grid, unchanged for any existing use.
    case "videoList":
      if (block.darkBackgroundImage) {
        return (
          <section
            className="bg-cover bg-center px-4 py-16 lg:px-[52px]"
            style={{ backgroundImage: `url(${block.darkBackgroundImage.url})`, backgroundColor: "#1a0000" }}
          >
            {block.heading && <h2 className="text-lg font-bold text-white">{block.heading}</h2>}
            {block.subheading && <p className="mt-1 text-lg text-white/80">{block.subheading}</p>}
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              {block.videos.map((v) => (
                <div key={v.youtubeId}>
                  <p className="mb-3 text-base text-white">{v.title}</p>
                  <div className="aspect-video w-full overflow-hidden rounded-xl">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${v.youtubeId}`}
                      title={v.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }
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

    case "videosWithTabsMarker":
      return <VideosWithTabs />;

    case "leadFormCta":
      return <LeadFormCta />;

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
      <BreadcrumbJsonLd
        current={page.title}
        path={`/${page.slug}`}
        trail={page.parent ? [{ label: page.parent.title, href: `/${page.parent.slug}` }] : undefined}
      />

      {page.layout.map((block) => (
        <BlockRenderer key={block.id ?? JSON.stringify(block)} block={block} />
      ))}

      {page.deeplink && (
        <div className="mx-auto w-full max-w-[1030px] px-4 pb-16">
          <Link href={page.deeplink} className="inline-block text-sm font-bold text-vf-red hover:underline">
            İlgili bağlantı →
          </Link>
        </div>
      )}

      <Footer />
    </main>
  );
}
