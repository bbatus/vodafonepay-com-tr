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
import { getFaqItems, getProductHero, getFeatureCards, getStepCards } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";

export const metadata: Metadata = {
  title: "QR ile Faturana Yansıt | Vodafone Pay",
  description:
    "Artık QR ile yapacağınız fiziksel harcamalarınızı Vodafone faturanıza yansıtabilir, üstelik harcama tutarınızı ilk çıkacak fatura döneminize kadar erteleyebilirsiniz!",
};

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

const fallbackFaqs: FaqItem[] = [
  {
    question: "Faturana Yansıt Nedir?",
    answer:
      "Faturana Yansıt, alışverişlerinizi hızlı ve güvenli bir şekilde gerçekleştirmenizi sağlayan alternatif bir ödeme yöntemidir. Faturalı veya faturasız fark etmeksizin, kredi kartı veya banka kartına ihtiyaç duymadan Faturana Yansıt ile harcama yapabilirsiniz.",
  },
  {
    question: "QR ile Faturana Yansıt nedir?",
    answer:
      "Vodafone Pay Uygulaması'nda TR Kare kod (QR) ile ödemede Faturana Yansıt'ı hem faturalı hem faturasız Vodafone mobil müşterileri kullanabilir. Ödeme tutarı, işlem ücreti ve Faturana Yansıt hizmet bedeli işlem onayın sonrası Vodafone mobil faturasına yansıtılacak ya da faturasız hatlar için TL bakiyesinden düşülecektir.",
  },
  {
    question: "QR ile Faturana Yansıt nasıl kullanılır?",
    answer:
      "Vodafone Pay Uygulaması ana sayfasında yer alan QR ikonuna tıkladıktan sonra \"QR ile Ödeme\" seçeneğini seçip POS cihazında yer alan TR Kare Kod'u (QR) okutmalısınız. Faturana Yansıt işlem ücreti, ödeme tutarı üzerinden %3 olarak hesaplanır.",
  },
  {
    question: "Faturana Yansıt'ı kullanarak yaptığım ödememde işlem detayına nasıl ulaşabilirim?",
    answer:
      "Vodafone Pay Uygulaması ana sayfasında yer alan Faturana Yansıt butonuna tıklayarak açılan İşlemler ekranında Faturana Yansıt harcama detaylarını görüntüleyebilirsin.",
  },
  {
    question: "TR Kare Kod (QR) ile ödemede Faturana Yansıt limitim neden düşük?",
    answer:
      "Faturana Yansıt limitleri müşteri özelinde belirlenmekte olup Vodafone Pay'de hesabını doğrulayan müşteriler, daha yüksek limitlerden faydalanabilirler.",
  },
  {
    question: "QR ile ödemede Anında Bakiye ile öde nasıl kullanılır?",
    answer:
      "POS cihazında yer alan TR Kare Kod'u (QR) okuttuktan sonra karşınıza çıkan işlem ekranında ödeme yöntemi olarak Anında Bakiye'yi seçerek işleme devam edebilirsiniz.",
  },
];

export default async function QrIleFaturanaYansit() {
  const [cmsFaqItems, cmsHero, cmsCards, cmsSteps] = await Promise.all([
    getFaqItems("qr-ile-faturana-yansit"),
    getProductHero("qr-ile-faturana-yansit"),
    getFeatureCards("qr-ile-faturana-yansit"),
    getStepCards("qr-ile-faturana-yansit"),
  ]);
  const faqs: FaqItem[] = cmsFaqItems?.length
    ? cmsFaqItems.map((f) => ({ question: f.question, answer: f.answer }))
    : fallbackFaqs;
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
      <StickyQr />
      <Breadcrumb current="Qr ile Faturana Yansıt" />
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
