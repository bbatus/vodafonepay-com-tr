import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductHero } from "@/components/ProductHero";
import { EarnWithCard } from "@/components/EarnWithCard";
import { WhereCanIBuy } from "@/components/WhereCanIBuy";
import { VideoGuideSection } from "@/components/VideoGuideSection";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getContentBlocks, getFaqItems, getProductHero } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Vodafone Pay Kart",
  description: "Vodafone Pay Sanal ve Fiziksel Kart ile harcamalarını kolayca ve güvenli bir şekilde gerçekleştirebilir, kazandığın nakit iadelerle daha fazla harcayabilirsin.",
  path: "/vodafone-pay-kart",
});

const fallbackFaqs: FaqItem[] = [
  {
    question: "Vodafone Pay Kart Nedir?",
    answer:
      "Vodafone Pay Kart herhangi bir banka müşterisi olmadan ve hangi operatör müşterisi olduğunuz fark etmeksizin kullanabileceğiniz ön ödemeli bir karttır.",
  },
  {
    question: "Vodafone Pay Kart Nasıl Alınır?",
    answer:
      "Fiziksel ve sanal kart olmak üzere 2 tür Vodafone Pay Kart bulunur. Fiziksel Vodafone Pay Kart sahibi olmak için Vodafone Mağazalarını ziyaret ederek kartı satın alabilir, Vodafone Pay Sanal Kart kullanmak için ise Vodafone Pay Uygulaması'nı indirebilirsiniz.",
  },
  {
    question: "Vodafone Pay Kart Nasıl Kullanılır?",
    answer:
      "Vodafone Pay Kart'larınıza uygulama aracılığıyla bakiye yükledikten sonra uygulama içerisindeki tüm işlemleri gerçekleştirebilir, kartlarınızı online alışverişlerde kullanabilirsiniz. Fiziksel mağazalardaki alışverişlerinizi de QR ile Ödeme veya Vodafone Pay Fiziksel Kart ile gerçekleştirebilirsiniz.",
  },
  {
    question: "Vodafone Pay Kart Limiti Ne Kadar?",
    answer: "Vodafone Pay hesabı doğrulanmış müşterilerin aylık limitleri 75.000 TL; hesabı doğrulanmamış müşterilerin limitleri 2.000 TL'dir.",
  },
  {
    question: "Vodafone Pay Kart Ücretli mi?",
    answer:
      "Vodafone Pay Sanal Kartınızı Vodafone Pay Uygulaması üzerinden ücretsiz şekilde edinebilirsiniz. Vodafone Pay Fiziksel Kartınızı ise Vodafone Mağazalarından satın alabilirsiniz. Güncel Vodafone Pay Kart fiyatları hakkında mağazalarımızdan detaylı bilgi alabilirsiniz.",
  },
];

export default async function VodafonePayKart() {
  const [cmsFaqItems, cmsHero, cmsSlides, cmsVideos] = await Promise.all([
    getFaqItems("vodafone-pay-kart"),
    getProductHero("vodafone-pay-kart"),
    getContentBlocks("kart-earn"),
    getContentBlocks("kart-video-guide"),
  ]);
  const faqs: FaqItem[] = cmsFaqItems?.length
    ? cmsFaqItems.map((f) => ({ question: f.question, answer: f.answer }))
    : fallbackFaqs;
  const slides = cmsSlides?.length
    ? cmsSlides.map((s) => ({ image: s.image?.url ?? "", text: s.text ?? "" }))
    : undefined;
  const videos = cmsVideos?.length
    ? cmsVideos.map((v) => ({ title: v.title ?? "", youtubeId: v.youtubeId ?? "" }))
    : undefined;

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current="Vodafone Pay Kart" />
      <ProductHero
        image={cmsHero?.image.url ?? "/images/kart-hero.jpg"}
        imageAlt={cmsHero?.image.alt || "Vodafone Pay Kart"}
        heading={cmsHero?.heading ?? "Vodafone Pay Kart ile dilediğin yerde harca, kazan"}
      />
      <EarnWithCard slides={slides} />
      <WhereCanIBuy />
      <VideoGuideSection videos={videos} />
      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
