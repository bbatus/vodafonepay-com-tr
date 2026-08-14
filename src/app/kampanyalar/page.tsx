import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { CardListItem } from "@/components/CardListGrid";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { getCampaigns, getFaqItems, getPageMeta } from "@/lib/cms";
import type { FaqItem } from "@/types/homepage";
import { CampaignsFilterableList } from "./CampaignsFilterableList";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/kampanyalar");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Nakit İade Kampanyaları | Pay'lilere Özel Fırsatlar | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay'in nakit iade ve indirim kampanyalarını incele, avantajlardan yararlan.",
    path: "/kampanyalar",
    image: pageMeta?.ogImage?.url,
  });
}

const fallbackFavorites: CardListItem[] = [
  { image: "/images/campaign-cesme.jpg", title: "Vodafone Pay ile Çeşme Plajlarında 1.000 TL Nakit İade!" },
  { image: "/images/campaign-hayat-su.jpg", title: "1 TL'ye Hayat Su Kapında!" },
  { image: "/images/campaign-market.jpg", title: "Market harcamanı ilk kez QR ile faturana yansıt, 100 TL indirim kazan!" },
];

const fallbackAllCampaigns: CardListItem[] = [
  { image: "/images/camp-01.jpg", title: "Kurum Faturalarını Vodafone Pay ile Öde 100 TL Nakit İade Kazan!" },
  { image: "/images/camp-02.jpg", title: "Vodafone Telefon Faturalarına %10 Nakit İade!" },
  { image: "/images/camp-03.jpg", title: "Yaz Alışverişin Cebinde, Nakit İaden Vodafone Pay'de!" },
  { image: "/images/camp-04.jpg", title: "Kolay Paket Yüklemelerine %20 Nakit İade!" },
  { image: "/images/camp-05.jpg", title: "Vodafone Pay'de Red'lilere Özel 50 TL Cüzdanım Kodu Hediye!" },
  { image: "/images/camp-06.jpg", title: "Vodafone Pay ile Çeşme Restoranlarında 750 TL Nakit İade!" },
  { image: "/images/camp-07.jpg", title: "1 TL'ye Hayat Su Kapında!" },
  { image: "/images/camp-08.jpg", title: "Anında Bakiye'de %20 İndirim!" },
  { image: "/images/camp-09.jpg", title: "İstanbulkart'ına Vodafone Pay ile Bakiye Yükle 100 TL Nakit İade Kazan!" },
  { image: "/images/camp-10.jpg", title: "Biletinal'da Vodafone'lulara 400 TL İndirim!" },
  { image: "/images/camp-11.jpg", title: "Vodafone Ev İnterneti Faturalarına 100 TL Nakit İade!" },
  { image: "/images/camp-12.jpg", title: "İlk QR Harcamanı Yap, %20 İndirim Kazan!" },
  { image: "/images/camp-13.jpg", title: "5 GB Hediye!" },
  { image: "/images/camp-14.jpg", title: "Vodafone Pay ile Deponu Doldururken Kazan!" },
  { image: "/images/camp-15.jpg", title: "Market harcamanı ilk kez QR ile faturana yansıt, 100 TL indirim kazan!" },
  { image: "/images/camp-16.png", title: "Pazarama'da %50 İndirim!" },
  { image: "/images/camp-17.jpg", title: "Dijital Platform Üyelikleriniz 3 Ay Bedava!" },
  { image: "/images/camp-18.jpg", title: "Vodafone Pay ile Çeşme Plajlarında 1.000 TL Nakit İade!" },
  { image: "/images/camp-19.jpg", title: "Vodafone Pay'li Yaz Boyunca Obilet'te Kazanıyor!" },
];

const fallbackFaqs: FaqItem[] = [
  {
    question: "Vodafone Pay kampanyalarına nasıl katılabilirim?",
    answer:
      "Vodafone Pay Uygulaması üzerinden kampanyaları inceleyerek katılmak istedikleriniz için \"Kampanyaya Katıl\" butonuna tıklayabilir veya kampanya esaslarında yer alan yönlendirmeleri uygulayarak kampanyalara katılabilirsiniz. Hesabını oluşturduktan sonra kampanya şartlarını sağlayarak faydalanabilirsin.",
  },
];

export default async function Kampanyalar() {
  const [cmsCampaigns, cmsFaqItems] = await Promise.all([getCampaigns(), getFaqItems("kampanyalar")]);

  const toCard = (c: NonNullable<typeof cmsCampaigns>[number]): CardListItem => ({
    image: c.image.url,
    title: c.title,
    description: c.description,
    href: c.slug ? `/kampanyalar/${c.slug}` : undefined,
    category: c.category?.slug,
  });

  const favorites = cmsCampaigns ? cmsCampaigns.filter((c) => c.featured).map(toCard) : fallbackFavorites;
  const allCampaigns = cmsCampaigns ? cmsCampaigns.filter((c) => !c.featured).map(toCard) : fallbackAllCampaigns;
  const faqs: FaqItem[] = cmsFaqItems?.length
    ? cmsFaqItems.map((f) => ({ question: f.question, answer: f.answer }))
    : fallbackFaqs;

  const pageMeta = await getPageMeta("/kampanyalar");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Kampanyalar"} />

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-20">
        <div className="flex flex-col items-center justify-center lg:pt-8">
          <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Kampanyalar</h1>
        </div>

        <CampaignsFilterableList favorites={favorites} allCampaigns={allCampaigns} />
      </section>

      <Faq items={faqs} />
      <Footer />
    </main>
  );
}
