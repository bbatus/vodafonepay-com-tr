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
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl bg-[#f9fafb] p-6">
            <Image src={card.icon} alt={card.title} width={40} height={40} className="h-10 w-10" />
            <h3 className="mt-4 text-lg font-bold text-black">{card.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
