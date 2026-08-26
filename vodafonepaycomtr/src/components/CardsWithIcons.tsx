import Image from "next/image";

export function CardsWithIcons({
  title,
  description,
  cards,
}: {
  title: string;
  description: string;
  cards: { icon: string; title: string; text: string }[];
}) {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <h2 className="text-2xl font-bold text-black lg:text-4xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-base text-gray-600">{description}</p>
      <div className="mt-10 flex flex-wrap justify-center gap-5">
        {cards.map((card) => (
          <div key={card.title} className="flex w-[253px] flex-col items-center rounded-md bg-vf-gray px-4 py-10 text-center">
            <Image src={card.icon} alt={card.title} width={80} height={80} className="mb-4 max-h-20 w-auto" />
            <span className="text-[28px] font-bold leading-8 text-vf-red">{card.title}</span>
            <p className="mt-3 text-base text-black">{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
