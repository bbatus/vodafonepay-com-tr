"use client";

import { useState } from "react";
import Image from "next/image";

interface Slide {
  image: string;
  text: string;
}

/**
 * A phone/product image next to a single-slide-at-a-time carousel card,
 * used by both the "Ayrıcalıklı Dünyası" and "Kartla Kazan" sections.
 */
export function ImageSideCarousel({
  sideImage,
  sideImageAlt,
  slides,
}: {
  sideImage: string;
  sideImageAlt: string;
  slides: Slide[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-10">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch">
        <Image
          src={sideImage}
          alt={sideImageAlt}
          width={280}
          height={575}
          className="h-auto w-[200px] shrink-0 lg:w-[240px]"
        />

        <div className="relative h-[300px] w-full flex-1 overflow-hidden rounded-2xl">
          <Image src={slides[active].image} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-xl font-bold text-white">
            {slides[active].text}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-x-2">
        {slides.map((slide, i) => (
          <button
            key={slide.image}
            aria-label={`${i + 1}. kart`}
            onClick={() => setActive(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === active ? "bg-vf-red" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
