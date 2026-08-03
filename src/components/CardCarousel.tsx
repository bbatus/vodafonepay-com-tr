import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";

export function CardCarousel({ cards }: { cards: { image: string; text: string }[] }) {
  return (
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
  );
}
