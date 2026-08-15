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
  const pageMeta = await getPageMeta("/qr-ile-faturana-yansit");
  return buildMetadata({
    title: pageMeta?.seoTitle || "QR ile Faturana Yansıt | Vodafone Pay",
    description: pageMeta?.seoDescription || "Artık QR ile yapacağınız fiziksel harcamalarınızı Vodafone faturanıza yansıtabilir, üstelik harcama tutarınızı ilk çıkacak fatura döneminize kadar erteleyebilirsiniz!",
    path: "/qr-ile-faturana-yansit",
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
    icon: "/images/icon-size-limit.png",
    title: "Size Özel Limit",
    text: "QR ile yapacağınız harcamaları size özel tanımlanmış limitinizle Vodafone faturanıza yansıtabilirsiniz.",
  },
  {
    icon: "/images/icon-fiziksel-harcama.svg",
    title: "Fiziksel Harcamalar",
    text: "Bu sayede artık fiziksel mağazalardaki harcamalarınızı faturanıza yansıtabilirsiniz.",
  },
  {
    icon: "/images/icon-faturana-yansit.png",
    title: "Faturana Yansıt",
    text: "Üstelik anında harcar, harcadığınız tutarın ödemesini ilk çıkacak faturanıza kadar ertelensin!",
  },
];

const fallbackSteps = [
  { number: "01", text: "Vodafone Pay Uygulaması ana sayfasında bulunan \"QR\" butonuna tıklayınız.", image: "/images/qr-step-1.jpg" },
  { number: "02", text: "\"QR ile Ödeme\" seçeneğinizi seçin.", image: "/images/qr-step-2.jpg" },
  { number: "03", text: "POS cihazındaki QR'ı okutun.", image: "/images/qr-step-3.jpg" },
  { number: "04", text: "Faturana Yansıt'ınız kapalı ise sözleşmeyi onaylayarak yöntemi aktifleştir.", image: "/images/qr-step-4.png" },
  { number: "05", text: "Faturanıza yansıtmak istediğiniz QR harcamanızı onaylayın.", image: "/images/qr-step-5.jpg" },
  { number: "06", text: "Tebrikler! QR harcamanız başarıyla faturanıza yansıtıldı.", image: "/images/qr-step-6.png" },
];

export default async function QrIleFaturanaYansit() {
  const [cmsFaqItems, cmsHero, cmsCards, cmsSteps] = await Promise.all([
    getFaqItems("qr-ile-faturana-yansit"),
    getProductHero("qr-ile-faturana-yansit"),
    getFeatureCards("qr-ile-faturana-yansit"),
    getStepCards("qr-ile-faturana-yansit"),
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

  const pageMeta = await getPageMeta("/qr-ile-faturana-yansit");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Qr ile Faturana Yansıt"} />
      <ProductHero
        image={cmsHero?.image.url ?? "/images/qr-hero.jpg"}
        imageAlt={cmsHero?.image.alt || "QR ile Faturana Yansıt"}
        heading={cmsHero?.heading ?? "QR ile Faturana Yansıt"}
      />
      <CardsWithIcons
        title="QR ile Faturana Yansıt"
        description="Artık QR ile yapacağınız fiziksel harcamalarınızı Vodafone faturanıza yansıtabilir, üstelik harcama tutarınızı ilk çıkacak fatura döneminize kadar erteleyebilirsiniz!"
        cards={cards}
      />
      <PhoneStepsCarousel heading="Nasıl kullanırım?" steps={steps} />
      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
