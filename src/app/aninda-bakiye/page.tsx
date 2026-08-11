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

export const metadata: Metadata = buildMetadata({
  title: "Anında Bakiye ile Sana Özel Mobil Ödeme Limiti | Vodafone Pay",
  description: "Size özel limitinizle dilediğiniz yerde harcama yapabilirsiniz!",
  path: "/aninda-bakiye",
});

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

const fallbackFaqs: FaqItem[] = [
  {
    question: "Anında Bakiye nedir? Kimler kullanabilir?",
    answer:
      "Anında Bakiye, Vodafone Pay tarafından sana özel olarak tanımlanan Faturana Yansıt limitini Vodafone Pay Sanal Kart'ına aktarabileceğin bir hizmettir. Yüklediğin Anında Bakiye'yi Vodafone Pay Sanal Kart aracılığıyla dilediğin yerde kullanabilirsin.",
  },
  {
    question: "Anında Bakiye'yi kimler kullanabilir?",
    answer:
      "Anında Bakiye'yi hem faturalı hem faturasız Vodafone müşterileri kullanabilir. Kullanabilmek için 18 yaşından büyük olman ve hattın yasal sahibi olman yeterlidir.",
  },
  {
    question: "Anında Bakiye'yi nasıl kullanabilirim?",
    answer: "Ana ekranda görülen \"Hemen al!\" butonuna tıklayarak ihtiyacın olan tutarı sanal kartına yükleyebilirsin.",
  },
  {
    question: "Anında Bakiye alırken Faturana Yansıt yöntemini açmam gerekli midir?",
    answer:
      "Evet, bu işlemin yapılabilmesi için Faturana Yansıt yöntemi açık olmalıdır. Sana özel tanımlanan Anında Bakiye, Vodafone faturana yansıtılarak ya da TL bakiyenden düşülerek tahsil edilir.",
  },
  {
    question: "Anında Bakiye ile yapacağım işlemlerde bir limit var mıdır?",
    answer:
      "Anında Bakiye'ni Vodafone Pay limitlerin ve Faturana Yansıt limitlerin dahilinde kullanabilirsin. Bakiye yükleme ve harcama için tek seferlik, günlük ve aylık limit 1.250 TL'dir.",
  },
  {
    question: "Anında Bakiye ile yapılan işlemler ücretli mi?",
    answer:
      "Anında Bakiye yüklemelerinde komisyon uygulanır. Ek olarak Anında Bakiye alınabilmesi için gerekli Faturana Yansıt Yöntemi'nin hizmet bedeline web sitemizden ulaşabilirsin.",
  },
  {
    question: "Anında Bakiye'me tanımlanan tutarı nasıl geri öderim?",
    answer:
      "Yüklenen Anında Bakiye tutarı, işlem ücreti ve Faturana Yansıt hizmet bedeli Vodafone Pay uygulamana kayıtlı GSM'e ait en yakın tarihli Vodafone faturana yansıtılacak ya da faturasız hatlar için TL bakiyenden düşülecektir.",
  },
  {
    question: "Anında Bakiye'mi nerelerde kullanabilirim?",
    answer: "Sana özel tanımlanan Anında Bakiye'ni yurtiçi ve yurtdışında Visa kart geçerli olan tüm kurum ve platformlarda kullanabilirsin.",
  },
  {
    question: "Anında Bakiye'mi TR Kare Kod (QR) işlemlerinde kullanabilir miyim?",
    answer: "Anında Bakiye'ni QR ile ödeme sayfasında kullanabilirsin.",
  },
  {
    question: "Anında Bakiye'mi Ulaşım Kartlarına yaptığım yüklemelerde kullanabilir miyim?",
    answer: "Anında Bakiye'ni, İşlemler menüsünde bulunan ulaşım kartlarına yükleme yapmak için kullanabilirsin.",
  },
  {
    question: "Anında Bakiye'mi fatura ödemelerinde kullanabilir miyim?",
    answer:
      "Anında Bakiye özelinde hesabına tanımlanan tutarı İnternet&TV, Su, Elektrik, Doğalgaz ve Telekom için yaptığın fatura ödemelerinde kolayca kullanabilirsin. Anında Bakiye alırken kullandığın Vodafone'a ait telefon hattının faturasını Anında Bakiye ile ödeyemezsin.",
  },
  {
    question: "Anında Bakiye'mi Kolay Paket ve Cep TL yüklemelerinde kullanabilir miyim?",
    answer: "Anında Bakiye'ni Vodafone hattına Kolay Paket tanımlamalarında ve Cep TL yüklemelerinde ödeme yöntemi olarak kullanabilirsin.",
  },
  {
    question: "Anında Bakiye ile hangi işlemleri yapabilirim?",
    answer:
      "Anında Bakiye'ni yurtiçi ve yurtdışında Visa kart geçerli olan tüm kurum ve platformlarda kullanabilir, kurum faturalarını ödeyebilir, Vodafone Kolay Paket, Cep TL ve Ulaşım Kartları yüklemelerinde kullanabilirsin.",
  },
  {
    question: "Anında Bakiye'mi Cüzdanım'a, diğer banka/kredi kartlarıma ya da diğer Vodafone Pay kartlarıma aktarabilir miyim?",
    answer:
      "Hayır, Anında Bakiye'ne özel tanımlanan tutar Cüzdanım'a, diğer banka hesapları/kredi kartlarına ya da diğer Vodafone Pay Sanal/Fiziksel kartlarına aktarılamaz ve nakit olarak çekilemez.",
  },
  {
    question: "Anında Bakiye'yi iptal/iade edebilir miyim?",
    answer: "Müşteri hizmetlerini arayarak iptal/iade işlemlerini yapabilirsin.",
  },
  {
    question: "Anında Bakiye işlem ve kart detaylarına nasıl ulaşabilirim?",
    answer:
      "Uygulama Ana Sayfasında bulunan Anında Bakiye butonuna tıklandığında işlem detaylarını, \"Detayları Gör\" butonuna tıklandığında ise kart detaylarını görüntüleyebilirsin.",
  },
  {
    question: "Anında Bakiye kartımın Son Kullanma Tarihi (SKT) dolarsa ne yapmalıyım?",
    answer:
      "Herhangi bir işleme gerek yoktur. Uygulama ilk giriş esnasında SKT'si dolan kartının yerine otomatik olarak yeni bir sanal kart oluşturulur ve mevcut bakiye yeni karta otomatik olarak aktarılır.",
  },
];

export default async function AnindaBakiye() {
  const [cmsFaqItems, cmsHero, cmsCards, cmsSteps] = await Promise.all([
    getFaqItems("aninda-bakiye"),
    getProductHero("aninda-bakiye"),
    getFeatureCards("aninda-bakiye"),
    getStepCards("aninda-bakiye"),
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
