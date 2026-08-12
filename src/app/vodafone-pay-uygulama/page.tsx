import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductHero } from "@/components/ProductHero";
import { AppFeatures } from "@/components/AppFeatures";
import { HowToEarn } from "@/components/HowToEarn";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getContentBlocks, getFaqItems, getPageMeta, getProductHero } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/vodafone-pay-uygulama");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Vodafone Pay Uygulaması ve Avantajları | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay Uygulaması'nı indirerek tüm harcamalarınızı kolayca takip edebilir, kazandıran kampanyalara katılabilirsiniz.",
    path: "/vodafone-pay-uygulama",
    image: pageMeta?.ogImage?.url,
  });
}

const fallbackFaqs: FaqItem[] = [
  {
    question: "Vodafone Pay Uygulaması Nedir?",
    answer:
      "Vodafone Pay Uygulaması, herhangi bir banka müşterisi olmadan ve hangi operatörü kullandığınız fark etmeden finansal işlemlerinizi tek bir uygulama içerisinden yönetmenizi sağlayan yeni nesil bir mobil cüzdan uygulamasıdır. Vodafone Pay Uygulaması ile Vodafone Pay Kart, Faturana Yansıt ve Vodafone Cüzdanım bakiyenizi ve harcamalarınızı yönetebilirsiniz.",
  },
  {
    question: "Vodafone Pay Uygulaması ile Neler Yapabilirsiniz?",
    answer:
      "Vodafone Pay Uygulaması kullanıcılarına kolay ve güvenli ödeme imkânı sunar. Özellikle 18 yaşından küçük kullanıcılar için online alışveriş yapmanın en pratik yoludur. Vodafone Pay Uygulamasında Vodafone faturasız hat kullanıcıları için nakit iade kazanabileceği Vodafone Kolay Paketler bulunur. Aynı zamanda uygulama ile kolay bir şekilde faturasız hattınıza TL yükleyebilirsiniz.",
  },
  {
    question: "Vodafone Pay Uygulaması Nasıl Kullanılır?",
    answer:
      "Vodafone Pay uygulamasını kullanabilmek için öncelikle Google Play Store ya da App Store üzerinden Vodafone Pay uygulamasını indirmeniz gerekir. Uygulamaya kaydolmak için 12 yaşından büyük bir kullanıcı olmalısınız. Kayıt ekranına TCKN, ad, soyad, doğum tarihi, uyruk, cep telefonu numarası, meslek ve e-posta bilgilerinizi girerek uygulamaya kaydolmalısınız.",
  },
  {
    question: "Vodafone Pay Uygulamasıyla Sanal Kart Nasıl Üretilir?",
    answer:
      "Vodafone Pay uygulamasına kaydolduktan sonra uygulama size otomatik olarak bir Vodafone Pay Sanal Kart oluşturur. Yeni bir sanal kart oluşturmak için 'Varlıklarım' alanının altında yer alan 'Vodafone Pay Kart Ekle' alanına dokunup 'Vodafone Pay Sanal' sekmesini seçmeniz ve 'Kart Ekle' butonuna dokunmanız yeterlidir.",
  },
  {
    question: "Vodafone Pay Uygulamasında Hangi İşlemleri Takip Edebilirim?",
    answer:
      "Vodafone Cüzdanım ya da Vodafone Pay Kart'a bakiye yükleyebilir, kartlarınız arasında bakiye aktarımı gerçekleştirebilir, faturasız hatlara Kolay Paket ve TL yükleyebilir, fatura ödemelerinizi gerçekleştirebilir ve tüm harcamalarınızı takip edebilirsiniz.",
  },
  {
    question: "Vodafone Pay Uygulamasında Kampanyaları Takip Edebilir miyim?",
    answer:
      "Vodafone Pay uygulamasına giriş yaptıktan sonra ana sayfada yer alan Kampanyalar başlığı altında güncel kampanyaları görebilir, 'Tümü' sekmesine tıklayarak tüm kampanyaları detaylı şekilde inceleyebilirsiniz.",
  },
];

export default async function VodafonePayUygulama() {
  const [cmsFaqItems, cmsHero, cmsSlides, cmsEarnSteps] = await Promise.all([
    getFaqItems("vodafone-pay-uygulama"),
    getProductHero("vodafone-pay-uygulama"),
    getContentBlocks("uygulama-ayricalikli"),
    getContentBlocks("uygulama-nasil-kazanirim"),
  ]);
  const faqs: FaqItem[] = cmsFaqItems?.length
    ? cmsFaqItems.map((f) => ({ question: f.question, answer: f.answer }))
    : fallbackFaqs;
  const slides = cmsSlides?.length
    ? cmsSlides.map((s) => ({ image: s.image?.url ?? "", text: s.text ?? "" }))
    : undefined;
  const earnSteps = cmsEarnSteps?.length
    ? cmsEarnSteps.map((s) => ({ icon: s.image?.url ?? "", title: s.title ?? "", description: s.text ?? "" }))
    : undefined;

  const pageMeta = await getPageMeta("/vodafone-pay-uygulama");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Vodafone Pay Uygulama"} />
      <ProductHero
        image={cmsHero?.image.url ?? "/images/uygulama-hero.jpg"}
        imageAlt={cmsHero?.image.alt || "Vodafone Pay Uygulaması"}
        heading={cmsHero?.heading ?? "Vodafone Pay Uygulaması'nı indir"}
      />
      <AppFeatures slides={slides} />
      <HowToEarn
        heading="Vodafone Pay ile Nasıl Kazanırım?"
        image="/images/step-nasil-kazanirim.png"
        steps={
          earnSteps ?? [
            {
              icon: "/images/icon-bakiye-yukle.svg",
              title: "Bakiye Yükle",
              description: "Banka/kredi kartınızdan, EFT ile veya tüm ATM'lerden dilediğiniz kadar bakiye yükleyin.",
            },
            {
              icon: "/images/icon-harca.svg",
              title: "Harca",
              description: "Tüm online ve fiziksel alışverişlerinizi Vodafone Pay Kart ile yapabilirsiniz.",
            },
            {
              icon: "/images/icon-kazan.png",
              title: "Kazan",
              description: "Kampanya kapsamında yaptığınız tüm harcamalardan yüzlerce TL nakit iade kazanın!",
            },
          ]
        }
      />
      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
