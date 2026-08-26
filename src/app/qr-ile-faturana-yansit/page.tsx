import type { Metadata } from "next";
import { SimpleProductPage, type SimpleProductFallbackCard, type SimpleProductFallbackStep } from "@/components/SimpleProductPage";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/qr-ile-faturana-yansit", {
    title: "QR ile Faturana Yansıt | Vodafone Pay",
    description:
      "Artık QR ile yapacağınız fiziksel harcamalarınızı Vodafone faturanıza yansıtabilir, üstelik harcama tutarınızı ilk çıkacak fatura döneminize kadar erteleyebilirsiniz!",
  });
}

// Fallback masking audit (KEPT DELIBERATELY) — CMS collection behind this
// section has ZERO rows, this IS what the site currently renders, not dead
// code. See SimpleProductPage.tsx's doc comment for the shared page shape.
const fallbackCards: SimpleProductFallbackCard[] = [
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

const fallbackSteps: SimpleProductFallbackStep[] = [
  { number: "01", text: "Vodafone Pay Uygulaması ana sayfasında bulunan \"QR\" butonuna tıklayınız.", image: "/images/qr-step-1.jpg" },
  { number: "02", text: "\"QR ile Ödeme\" seçeneğinizi seçin.", image: "/images/qr-step-2.jpg" },
  { number: "03", text: "POS cihazındaki QR'ı okutun.", image: "/images/qr-step-3.jpg" },
  { number: "04", text: "Faturana Yansıt'ınız kapalı ise sözleşmeyi onaylayarak yöntemi aktifleştir.", image: "/images/qr-step-4.png" },
  { number: "05", text: "Faturanıza yansıtmak istediğiniz QR harcamanızı onaylayın.", image: "/images/qr-step-5.jpg" },
  { number: "06", text: "Tebrikler! QR harcamanız başarıyla faturanıza yansıtıldı.", image: "/images/qr-step-6.png" },
];

export default async function QrIleFaturanaYansit() {
  return (
    <SimpleProductPage
      pageKey="qr-ile-faturana-yansit"
      breadcrumbLabel="Qr ile Faturana Yansıt"
      heroImage="/images/qr-hero.jpg"
      heroImageAlt="QR ile Faturana Yansıt"
      heroHeading="QR ile Faturana Yansıt"
      cardsTitle="QR ile Faturana Yansıt"
      cardsDescription="Artık QR ile yapacağınız fiziksel harcamalarınızı Vodafone faturanıza yansıtabilir, üstelik harcama tutarınızı ilk çıkacak fatura döneminize kadar erteleyebilirsiniz!"
      fallbackCards={fallbackCards}
      fallbackSteps={fallbackSteps}
    />
  );
}
