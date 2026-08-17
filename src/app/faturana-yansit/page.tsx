import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductHero } from "@/components/ProductHero";
import { CardsWithIcons } from "@/components/CardsWithIcons";
import { VideosWithTabs } from "@/components/VideosWithTabs";
import { HowToEarn } from "@/components/HowToEarn";
import { BrandLogoGrid } from "@/components/BrandLogoGrid";
import { LeadFormCta } from "@/components/LeadFormCta";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getContentBlocks, getFaqItems, getFeatureCards, getPageMeta, getProductHero } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/faturana-yansit");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Faturana Yansıt | Mobil Ödeme | Vodafone Pay",
    description: pageMeta?.seoDescription || "Yalnızca cep telefonu numaranızı kullanarak indirimli alışverişin keyfini çıkarın!",
    path: "/faturana-yansit",
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
    icon: "/images/icon-size-limit2.png",
    title: "Size Özel Limit",
    text: "Her ay 6.500 TL'ye varan size özel limit.",
  },
  {
    icon: "/images/icon-indirim.svg",
    title: "Anlaşmalı İndirimler",
    text: "Anlaşmalı markalarda size özel indirimler.",
  },
  {
    icon: "/images/icon-tek-fatura.png",
    title: "Tek Fatura",
    text: "Tek faturada harcama özeti.",
  },
];

const earnSteps = [
  {
    icon: "/images/icon-fy-ac.svg",
    title: "Faturana Yansıt'ı Aç",
    description: "Faturana Yansıt'ı Vodafone Pay veya Yanımda uygulaması üzerinden ücretsiz açabilirsiniz.",
  },
  {
    icon: "/images/icon-fy-sec.svg",
    title: "Faturana Yansıt'ı Seç",
    description: "Anlaşmalı markalarda ödeme adımında Faturana Yansıt'ı seçebilirsiniz.",
  },
  {
    icon: "/images/icon-fy-harcamalarini.svg",
    title: "Harcamalarını Faturana Yansıt",
    description: "Hızlı ve güvenli bir şekilde alışverişinizi tamamlayabilir, harcamalarınızı faturanıza yansıtabilirsiniz.",
  },
];

const fallbackFaqs: FaqItem[] = [
  {
    question: "Faturana Yansıt Nedir?",
    answer:
      "Faturana Yansıt, alışverişlerinizi hızlı ve güvenli bir şekilde gerçekleştirmenizi sağlayan alternatif bir ödeme yöntemidir. Faturalı veya faturasız fark etmeksizin, kredi kartı veya banka kartına ihtiyaç duymadan Faturana Yansıt ile harcama yapabilirsiniz.",
  },
  {
    question: "Faturana Yansıt'ı kullanarak yaptığım ödememde işlem detayına nasıl ulaşabilirim?",
    answer:
      "Vodafone Pay Uygulaması ana sayfasında yer alan Faturana Yansıt butonuna tıklayarak açılan İşlemler ekranında Faturana Yansıt harcama detaylarını görüntüleyebilirsin.",
  },
  {
    question: "Faturana Yansıt Nerelerde Geçerli?",
    answer:
      "Faturana Yansıt yöntemini PUBG Mobile, Mobil Legends, Zula, Candy Crush, Royal Match ve Brawl Stars gibi birçok online oyunun yer aldığı App Store, Google Play Store ve Huawei App Gallery gibi uygulama mağazalarında; Netflix, Spotify, Starbucks, Biletinial, Kitapyurdu, GAİN, DeFacto, Hızlı Çiçek gibi platformlarda kullanabilirsiniz.",
  },
  {
    question: "Faturana Yansıt Yöntemiyle Nasıl Alışveriş Yapılır?",
    answer:
      "Uygulama ve uygulama içi harcamalarınızı Vodafone Pay ile Faturana Yansıt yöntemini seçerek faturanıza yansıtabilirsiniz. App Store, Google Play Store, Huawei App Gallery ya da Spotify, Biletinial, Kitapyurdu, Netflix, GAİN, DeFacto, Hızlı Çiçek gibi platformlarda ödeme adımında 'Faturana Yansıt' seçeneğini seçmeniz yeterli.",
  },
  {
    question: "Faturana Yansıt limitinizi nasıl arttırabilirsiniz?",
    answer:
      "Faturana Yansıt limitleriniz her ayın 1'inde yenilenir. Vodafone Pay üzerinden hesap doğrulaması yaparak tek seferlik işlem limitinizi 2.500 TL'ye, aylık harcama limitinizi ise en fazla 6.500 TL'ye kadar yükseltebilirsiniz. Detaylı bilgi için 0212 942 21 21 numaralı Vodafone Pay Müşteri Hizmetleri ile görüşebilirsiniz.",
  },
  {
    question: "Faturana Yansıt limitleri nelerdir?",
    answer:
      "Faturana Yansıt limitleri her bir müşteriye özel olarak atanır. Hesap doğrulaması yapan müşteriler için tek seferlik işlem limiti 2.500 TL, aylık harcama limiti 6.500 TL'ye kadar; doğrulama yapmayan müşteriler için tek seferlik işlem limiti 1.000 TL, aylık harcama limiti en fazla 2.750 TL'dir.",
  },
  {
    question: "Faturana Yansıt'ın kolaylıkları nelerdir?",
    answer:
      "Kredi kartı ya da nakit ile uğraşmadan yalnızca cep telefonu numaranız ile alışverişinizi gerçekleştirebilir, harcamalarınızı tek bir yerden kontrol edebilir, işlemlerinizi saniyeler içinde tamamlayabilirsiniz. Ayrıca kredi kartınızın çalınması ya da kaybolması gibi güvenlik sorunlarıyla karşılaşmazsınız.",
  },
  {
    question: "Faturana Yansıt'ı nasıl açabilirsiniz?",
    answer:
      "SMS kısmına \"FATURANA YANSIT AC\" yazıp 7878'e ücretsiz göndererek açabilirsiniz. Ayrıca Vodafone Yanımda Uygulaması Ayarlar bölümünden, Dijital Asistan TOBİ üzerinden, Vodafone Pay uygulamasından, Google Play ve App Store üzerinden de aktivasyon sağlanabilir.",
  },
  {
    question: "Faturana Yansıt'ı nasıl kapatabilirsiniz?",
    answer:
      "Vodafone Yanımda uygulamasında \"Hesabım\" sekmesi üzerinden \"Ödeme Yöntemlerim\" içerisindeki Faturana Yansıt seçeneğini seçerek kapatabilirsiniz. Ayrıca 0212 942 21 21'i arayarak, 7878'e \"FATURANA YANSIT KAPAT\" yazarak veya Vodafone Pay uygulaması üzerinden de kapatabilirsiniz.",
  },
  {
    question: "Vodafone Pay uygulaması aracılığıyla Faturana Yansıt işlemlerinizi nasıl takip edebilirsiniz?",
    answer:
      "Vodafone Pay ile Faturana Yansıt harcamalarınızı yönetebilir, limitinizi görüntüleyebilir ve Faturana Yansıt geçmişinizi inceleyebilirsiniz.",
  },
  {
    question: "Faturana Yansıt'ı Google Play Store'da nasıl aktive edebilirsiniz?",
    answer:
      "Google Play uygulamasını açıp Menü kısmından \"Ödeme Yöntemleri\" sekmesini açın, \"Ödeme Yöntemi Ekle\" başlığı altındaki \"Vodafone Pay – Mobil Ödeme\"yi seçin. Telefonunuza SMS ile gelen tek seferlik şifreyi girerek ödeme yöntemini eklemiş olursunuz.",
  },
  {
    question: "Faturana Yansıt'ı App Store'da nasıl aktive edebilirsiniz?",
    answer:
      "iOS cihazınızdan \"Ayarlar\" > \"Apple Kimliği\" > \"Ödeme ve Teslimat\" > \"Ödeme Yöntemi Ekle\" adımlarını izleyip Faturana Yansıt sekmesinden telefon numaranızı girin. SMS ile gelen doğrulama kodunu girdikten sonra kullanmaya başlayabilirsiniz.",
  },
  {
    question: "Mobil Ödeme nedir?",
    answer:
      "Vodafone Mobil Ödeme alışverişlerinizi hızlı ve güvenli bir şekilde gerçekleştirmenizi sağlayan tahsilat aracıdır. Faturalı veya faturasız fark etmeksizin, kredi kartı veya banka kartına ihtiyaç duymadan alışverişlerinizi gerçekleştirebilirsiniz.",
  },
];

export default async function FaturanaYansit() {
  const [cmsFaqItems, cmsHero, cmsCards, cmsEarnSteps, cmsBrands] = await Promise.all([
    getFaqItems("faturana-yansit"),
    getProductHero("faturana-yansit"),
    getFeatureCards("faturana-yansit"),
    getContentBlocks("faturana-yansit-nasil-kazanirim"),
    getContentBlocks("brand-logos"),
  ]);
  const faqs: FaqItem[] = cmsFaqItems?.length
    ? cmsFaqItems.map((f) => ({ question: f.question, answer: f.answer }))
    : fallbackFaqs;
  const cards = cmsCards?.length
    ? cmsCards.map((c) => ({ icon: c.icon.url, title: c.title, text: c.text }))
    : fallbackCards;
  const cmsSteps = cmsEarnSteps?.length
    ? cmsEarnSteps.map((s) => ({ icon: s.image?.url ?? "", title: s.title ?? "", description: s.text ?? "" }))
    : earnSteps;
  // RFP feedback 5.0: content-blocks ARE seeded for this page, so the old
  // `: undefined` branch only ever fired on a CMS failure — where it made the
  // component fall back to hardcoded copy. Empty now means the section is
  // simply not rendered.
  const brands = (cmsBrands ?? []).map((b) => ({ name: b.title ?? "", logo: b.image?.url ?? "" }));

  const pageMeta = await getPageMeta("/faturana-yansit");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Faturana Yansıt"} />
      <ProductHero
        image={cmsHero?.image.url ?? "/images/fy-hero.jpg"}
        imageAlt={cmsHero?.image.alt || "Faturana Yansıt"}
        heading={cmsHero?.heading ?? "Yalnızca cep telefonu numaranızı kullanarak indirimli alışverişin keyfini çıkarın!"}
      />
      <CardsWithIcons
        title="Neden Faturana Yansıt?"
        description="Harcamalarınızı Vodafone faturanıza yansıtın, ödemesini ilk çıkacak faturanıza kadar erteleyin!"
        cards={cards}
      />
      <VideosWithTabs />
      <HowToEarn heading="Nasıl Kullanırım?" image="/images/fy-nasil-kazanirim.png" steps={cmsSteps} invertIcons={false} />
      <BrandLogoGrid brands={brands} />
      <LeadFormCta />
      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
