import Image from "next/image";

export function ProductHero({
  image,
  imageAlt,
  heading,
}: {
  image: string;
  imageAlt: string;
  heading: string;
}) {
  return (
    <section className="mx-auto max-w-[1030px] px-4 lg:pt-4">
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src={image}
          alt={imageAlt}
          width={1030}
          height={420}
          priority
          className="h-[240px] w-full object-cover lg:h-[420px]"
        />
      </div>
      <div className="bg-[#f3f4f6] px-6 py-8 text-center">
        <p className="text-2xl font-bold text-black lg:text-3xl">{heading}</p>
      </div>
    </section>
  );
}
