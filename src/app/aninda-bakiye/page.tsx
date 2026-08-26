import type { Metadata } from "next";
import { SimpleProductPage, type SimpleProductFallbackCard, type SimpleProductFallbackStep } from "@/components/SimpleProductPage";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/aninda-bakiye", {
    title: "Anında Bakiye ile Sana Özel Mobil Ödeme Limiti | Vodafone Pay",
    description: "Size özel limitinizle dilediğiniz yerde harcama yapabilirsiniz!",
  });
}

// Fallback masking audit (KEPT DELIBERATELY) — CMS collection behind this
// section has ZERO rows, this IS what the site currently renders, not dead
// code. See SimpleProductPage.tsx's doc comment for the shared page shape.
const fallbackCards: SimpleProductFallbackCard[] = [
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

const fallbackSteps: SimpleProductFallbackStep[] = [
  { number: "01", text: "Vodafone Pay Uygulaması ana sayfasında bulunan \"Anında Bakiye, Hemen Al\" butonuna tıklayınız.", image: "/images/ab-step-1.jpg" },
  { number: "02", text: "Faturana Yansıt kapalı ise aktive edin.", image: "/images/ab-step-2.jpg" },
  { number: "03", text: "Sözleşmeleri onaylayarak aktivasyonunuzu tamamlayın.", image: "/images/ab-step-3.jpg" },
  { number: "04", text: "Faturana Yansıt limitinizden kartınıza aktarmak istediğiniz tutarı giriniz.", image: "/images/ab-step-4.jpg" },
  { number: "05", text: "Yüklemek istediğiniz tutarı onaylayın.", image: "/images/ab-step-5.jpg" },
  { number: "06", text: "GSM numaranıza gelen 4 haneli onay kodunu girerek yükleme işleminizi tamamlayın.", image: "/images/ab-step-6.jpg" },
];

export default async function AnindaBakiye() {
  return (
    <SimpleProductPage
      pageKey="aninda-bakiye"
      breadcrumbLabel="Anında Bakiye"
      heroImage="/images/ab-hero.jpg"
      heroImageAlt="Anında Bakiye"
      heroHeading="Kart Limitiniz Bittiği Anda Anında Bakiye Yanınızda!"
      cardsTitle="Neden Anında Bakiye?"
      cardsDescription="Kart limitiniz bittiği anda Anında Bakiye yanınızda!"
      fallbackCards={fallbackCards}
      fallbackSteps={fallbackSteps}
    />
  );
}
