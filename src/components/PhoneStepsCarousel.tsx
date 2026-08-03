"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export function PhoneStepsCarousel({
  heading,
  steps,
}: {
  heading: string;
  steps: { number: string; text: string; image: string }[];
}) {
  const [active, setActive] = useState(0);
  const step = steps[active];

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <h2 className="text-center text-2xl font-bold text-black lg:text-4xl">{heading}</h2>

      <div className="mt-10 flex flex-col items-center gap-x-16 gap-y-8 lg:flex-row lg:justify-center">
        <Image
          src={step.image}
          alt={`Adım ${step.number}`}
          width={260}
          height={533}
          className="h-auto w-[220px] shrink-0"
        />
        <div className="flex max-w-sm items-start gap-x-4">
          <span className="text-3xl font-bold text-[#e60000]">{step.number}</span>
          <p className="text-lg text-black">{step.text}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-x-4">
        <button
          aria-label="Önceki adım"
          onClick={() => setActive((i) => (i - 1 + steps.length) % steps.length)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        {steps.map((s, i) => (
          <button
            key={s.number}
            aria-label={`Adım ${s.number}`}
            onClick={() => setActive(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === active ? "bg-[#e60000]" : "bg-gray-300"}`}
          />
        ))}
        <button
          aria-label="Sonraki adım"
          onClick={() => setActive((i) => (i + 1) % steps.length)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
