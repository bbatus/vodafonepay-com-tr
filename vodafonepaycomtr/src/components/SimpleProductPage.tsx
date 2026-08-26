import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductHero } from "@/components/ProductHero";
import { CardsWithIcons } from "@/components/CardsWithIcons";
import { PhoneStepsCarousel } from "@/components/PhoneStepsCarousel";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getFaqItems, getFeatureCards, getPageMeta, getProductHero, getStepCards, type ProductHeroPage } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";

/**
 * Follow-up 25.08 (SonarQube duplication audit): aninda-bakiye/page.tsx and
 * qr-ile-faturana-yansit/page.tsx were byte-for-byte the same page shape —
 * Hero + CardsWithIcons + PhoneStepsCarousel + Faq, same CMS fetches, same
 * fallback→CMS-data mapping — with only the page-specific copy (titles,
 * fallback cards/steps) actually differing (flagged at 73.8% duplicated,
 * ~76 lines each). Pulled the shared shape into this one component; each
 * page.tsx now only owns its own hardcoded fallback content and
 * `generateMetadata` (which Next.js requires exported per-route, can't be
 * shared this way).
 *
 * NOT used for faturana-yansit — that page has a genuinely different
 * section composition (VideosWithTabs/HowToEarn/BrandLogoGrid/LeadFormCta
 * instead of PhoneStepsCarousel), so forcing it into this same shape would
 * mean bloating this component with page-specific branches instead of
 * removing real duplication.
 */
export type SimpleProductFallbackCard = { icon: string; title: string; text: string };
export type SimpleProductFallbackStep = { number: string; text: string; image: string };

export async function SimpleProductPage({
  pageKey,
  breadcrumbLabel,
  heroImage,
  heroImageAlt,
  heroHeading,
  cardsTitle,
  cardsDescription,
  fallbackCards,
  fallbackSteps,
}: {
  pageKey: ProductHeroPage;
  breadcrumbLabel: string;
  heroImage: string;
  heroImageAlt: string;
  heroHeading: string;
  cardsTitle: string;
  cardsDescription: string;
  fallbackCards: SimpleProductFallbackCard[];
  fallbackSteps: SimpleProductFallbackStep[];
}) {
  const [cmsFaqItems, cmsHero, cmsCards, cmsSteps, pageMeta] = await Promise.all([
    getFaqItems(pageKey),
    getProductHero(pageKey),
    getFeatureCards(pageKey),
    getStepCards(pageKey),
    getPageMeta(`/${pageKey}`),
  ]);
  // RFP feedback 5.0: no hardcoded FAQ fallback — an empty CMS result renders
  // no FAQ section at all rather than copy nobody can edit.
  const faqs: FaqItem[] = (cmsFaqItems ?? []).map((f) => ({ question: f.question, answer: f.answer, deeplink: f.deeplink }));
  const cards = cmsCards?.length
    ? cmsCards.map((c) => ({ icon: c.icon.url, title: c.title, text: c.text }))
    : fallbackCards;
  const steps = cmsSteps?.length
    ? cmsSteps.map((s) => ({ number: s.number, text: s.text, image: s.image.url }))
    : fallbackSteps;

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || breadcrumbLabel} />
      <ProductHero
        image={cmsHero?.image.url ?? heroImage}
        imageAlt={cmsHero?.image.alt || heroImageAlt}
        heading={cmsHero?.heading ?? heroHeading}
      />
      <CardsWithIcons title={cardsTitle} description={cardsDescription} cards={cards} />
      <PhoneStepsCarousel heading="Nasıl kullanırım?" steps={steps} />
      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
