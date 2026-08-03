import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";

const cards = [
  {
    image: "/images/uygulama-ayricalikli-1.png",
    text: "Vodafone Pay Kart, Faturana Yansıt ve Vodafone Cüzdanım bakiyenizi ve harcamalarınızı yönetebilir, limitlerinizi güncelleyebilirsiniz",
  },
  {
    image: "/images/uygulama-ayricalikli-2.png",
    text: "Yenilenen, yüzlerce TL kazandıran, birbirinden farklı kampanyalara katılabilirsiniz.",
  },
  {
    image: "/images/uygulama-ayricalikli-1.png",
    text: "Tüm faturalarınızı tek bir yerden ödeyebilir, İstanbulkartınıza bakiye yükleyebilirsiniz.",
  },
];

export function AppFeatures() {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-black lg:text-4xl">Vodafone Pay&apos;in Ayrıcalıklı Dünyası</h2>
        <p className="mt-4 text-base text-gray-600">
          Vodafone Pay Uygulaması&apos;nı indirerek tüm harcamalarınızı kolayca takip edebilir, kazandıran
          kampanyalara katılabilirsiniz.
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <Image
          src="/images/step-app.png"
          alt="Vodafone Pay Uygulaması"
          width={280}
          height={575}
          className="h-auto w-[220px] lg:w-[280px]"
        />
      </div>

      <div className="mt-10 flex gap-x-4 overflow-x-auto pb-2">
        {cards.map((card, i) => (
          <ScrollReveal key={i} className="relative h-[300px] w-[240px] shrink-0 overflow-hidden rounded-2xl">
            <Image src={card.image} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-lg font-bold text-white">
              {card.text}
            </p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
