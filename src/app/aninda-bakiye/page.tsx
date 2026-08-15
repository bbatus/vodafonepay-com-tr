import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductHero } from "@/components/ProductHero";
import { CardsWithIcons } from "@/components/CardsWithIcons";
import { PhoneStepsCarousel } from "@/components/PhoneStepsCarousel";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getFaqItems, getFeatureCards, getPageMeta, getProductHero, getStepCards } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/aninda-bakiye");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Anında Bakiye ile Sana Özel Mobil Ödeme Limiti | Vodafone Pay",
    description: pageMeta?.seoDescription || "Size özel limitinizle dilediğiniz yerde harcama yapabilirsiniz!",
    path: "/aninda-bakiye",
    image: pageMeta?.ogImage?.url,
  });
}

/**
 * RFP feedback 5.0 (fallback masking audit) — KEPT DELIBERATELY.
 *
 * Checked against the live DB: the CMS collection behind this section has ZERO
 * rows, so unlike the FAQ/announcement/campaign fallbacks removed in this
 * round, this array is not dead code that only fires on an outage — it IS what
 * the site currently renders. Deleting it would blank a working section rather
 * than reveal a masked failure. Remove it in the same change that seeds the
 * collection; see the round report's "kalan fallback'ler" table.
 */
const fallbackCards = [
  {
    icon: "/images/icon-size-limit3.png",
    title: "Size Özel Limit",
    text: "Size özel limitinizi kartınıza aktarabilir, üstelik aktardığınız tutarı hemen ödemezsiniz.",
  },
  {
    icon: "/images/icon-harcama-kolayligi.png",
    title: "Harcama Kolaylığı",
    text: "Aktardığınız tutarı hem online hem de QR fonksiyonu sayesinde fiziksel alışverişlerinizde kullanabilirsiniz.",
  },
  {
    icon: "/images/icon-esnek-odeme.png",
    title: "Esnek Ödeme",
    text: "Yüklediğiniz tutarın ödemesini ilk çıkacak faturanıza kadar erteleyebilirsiniz.",
  },
];

const fallbackSteps = [
  { number: "01", text: "Vodafone Pay Uygulaması ana sayfasında bulunan \"Anında Bakiye, Hemen Al\" butonuna tıklayınız.", image: "/images/ab-step-1.jpg" },
  { number: "02", text: "Faturana Yansıt kapalı ise aktive edin.", image: "/images/ab-step-2.jpg" },
  { number: "03", text: "Sözleşmeleri onaylayarak aktivasyonunuzu tamamlayın.", image: "/images/ab-step-3.jpg" },
  { number: "04", text: "Faturana Yansıt limitinizden kartınıza aktarmak istediğiniz tutarı giriniz.", image: "/images/ab-step-4.jpg" },
  { number: "05", text: "Yüklemek istediğiniz tutarı onaylayın.", image: "/images/ab-step-5.jpg" },
  { number: "06", text: "GSM numaranıza gelen 4 haneli onay kodunu girerek yükleme işleminizi tamamlayın.", image: "/images/ab-step-6.jpg" },
];

export default async function AnindaBakiye() {
  const [cmsFaqItems, cmsHero, cmsCards, cmsSteps] = await Promise.all([
    getFaqItems("aninda-bakiye"),
    getProductHero("aninda-bakiye"),
    getFeatureCards("aninda-bakiye"),
    getStepCards("aninda-bakiye"),
  ]);
  // RFP feedback 5.0: no hardcoded FAQ fallback — an empty CMS result renders
  // no FAQ section at all rather than copy nobody can edit.
  const faqs: FaqItem[] = (cmsFaqItems ?? []).map((f) => ({ question: f.question, answer: f.answer }));
  const cards = cmsCards?.length
    ? cmsCards.map((c) => ({ icon: c.icon.url, title: c.title, text: c.text }))
    : fallbackCards;
  const steps = cmsSteps?.length
    ? cmsSteps.map((s) => ({ number: s.number, text: s.text, image: s.image.url }))
    : fallbackSteps;

  const pageMeta = await getPageMeta("/aninda-bakiye");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Anında Bakiye"} />
      <ProductHero
        image={cmsHero?.image.url ?? "/images/ab-hero.jpg"}
        imageAlt={cmsHero?.image.alt || "Anında Bakiye"}
        heading={cmsHero?.heading ?? "Kart Limitiniz Bittiği Anda Anında Bakiye Yanınızda!"}
      />
      <CardsWithIcons
        title="Neden Anında Bakiye?"
        description="Kart limitiniz bittiği anda Anında Bakiye yanınızda!"
        cards={cards}
      />
      <PhoneStepsCarousel heading="Nasıl kullanırım?" steps={steps} />
      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
