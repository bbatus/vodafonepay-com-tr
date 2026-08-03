import Image from "next/image";
import { CardCarousel } from "@/components/CardCarousel";

const cards = [
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

export function EarnWithCard() {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <h2 className="text-2xl font-bold text-black lg:text-4xl">Vodafone Pay Kart ile Kazan</h2>
      <p className="mt-4 max-w-2xl text-base text-gray-600">
        Vodafone Pay Sanal ve Fiziksel Kart ile harcamalarını kolayca ve güvenli bir şekilde
        gerçekleştirebilir, kazandığın nakit iadelerle daha fazla harcayabilirsin.
      </p>
      <div className="mt-10 flex justify-center">
        <Image src="/images/kart-visa.svg" alt="Vodafone Pay Kart" width={280} height={175} className="h-auto w-[240px]" />
      </div>
      <CardCarousel cards={cards} />
    </section>
  );
}
