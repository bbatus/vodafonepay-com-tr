import { ImageSideCarousel } from "@/components/ImageSideCarousel";

interface Slide {
  image: string;
  text: string;
}

const fallbackSlides: Slide[] = [
  {
    image: "/images/uygulama-ayricalikli-1.jpg",
    text: "Vodafone Pay Kart, Faturana Yansıt ve Vodafone Cüzdanım bakiyenizi ve harcamalarınızı yönetebilir, limitlerinizi güncelleyebilirsiniz",
  },
  {
    image: "/images/uygulama-ayricalikli-2.jpg",
    text: "Yenilenen, yüzlerce TL kazandıran, birbirinden farklı kampanyalara katılabilirsiniz.",
  },
  {
    image: "/images/uygulama-ayricalikli-3.jpg",
    text: "Tüm faturalarınızı tek bir yerden ödeyebilir, İstanbulkartınıza bakiye yükleyebilirsiniz.",
  },
];

export function AppFeatures({ slides = fallbackSlides }: { slides?: Slide[] }) {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-black lg:text-4xl">Vodafone Pay&apos;in Ayrıcalıklı Dünyası</h2>
        <p className="mt-4 text-base text-gray-600">
          Vodafone Pay Uygulaması&apos;nı indirerek tüm harcamalarınızı kolayca takip edebilir, kazandıran
          kampanyalara katılabilirsiniz.
        </p>
      </div>
      <ImageSideCarousel sideImage="/images/step-app.png" sideImageAlt="Vodafone Pay Uygulaması" slides={slides} />
    </section>
  );
}
