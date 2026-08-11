import { ImageSideCarousel } from "@/components/ImageSideCarousel";

interface Slide {
  image: string;
  text: string;
}

const fallbackSlides: Slide[] = [
  {
    image: "/images/kart-earn-1.jpg",
    text: "Vodafone Pay Kart'ınıza banka/kredi kartı, EFT veya tüm ATM'lerden dilediğiniz kadar bakiye yükleyebilirsiniz.",
  },
  {
    image: "/images/kart-earn-2.jpg",
    text: "Tüm online ve fiziksel alışverişinizi Vodafone Pay Kart ile yapabilir, harcadıkça kazanabilirsiniz.",
  },
  {
    image: "/images/kart-earn-3.jpg",
    text: "Vodafone Pay Kart'ınızı ve Uygulamadaki QR'ınızı tüm POS'larda kullanarak, güvenli ve temassız alışveriş yapabilirsiniz.",
  },
];

export function EarnWithCard({ slides = fallbackSlides }: { slides?: Slide[] }) {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <h2 className="text-2xl font-bold text-black lg:text-4xl">Vodafone Pay Kart ile Kazan</h2>
      <p className="mt-4 max-w-2xl text-base text-gray-600">
        Vodafone Pay Sanal ve Fiziksel Kart ile harcamalarını kolayca ve güvenli bir şekilde
        gerçekleştirebilir, kazandığın nakit iadelerle daha fazla harcayabilirsin.
      </p>
      <ImageSideCarousel sideImage="/images/kart-visa.svg" sideImageAlt="Vodafone Pay Kart" slides={slides} />
    </section>
  );
}
