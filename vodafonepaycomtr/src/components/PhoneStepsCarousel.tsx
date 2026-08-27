"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface Step {
  number: string;
  text: string;
  image: string;
}

function StepBox({ step, active }: { step: Step; active: boolean }) {
  return (
    <div
      className={`flex h-[226px] flex-col justify-center gap-y-2 rounded-xl p-5 transition-colors ${
        active ? "bg-vf-red text-white" : "bg-vf-gray text-black"
      }`}
    >
      <span className="text-[40px] font-bold leading-[1.1]">{step.number}</span>
      <p className="text-base">{step.text}</p>
    </div>
  );
}

export function PhoneStepsCarousel({ heading, steps }: { heading: string; steps: Step[] }) {
  const [active, setActive] = useState(0);
  const half = Math.ceil(steps.length / 2);
  const leftSteps = steps.slice(0, half);
  const rightSteps = steps.slice(half);
  const goPrev = () => setActive((i) => (i - 1 + steps.length) % steps.length);
  const goNext = () => setActive((i) => (i + 1) % steps.length);

  return (
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      <h2 className="text-center text-2xl font-bold text-black lg:text-4xl">{heading}</h2>

      <div className="mt-10 hidden gap-5 lg:flex">
        <div className="flex w-1/3 flex-col gap-y-5">
          {leftSteps.map((s, i) => (
            <StepBox key={s.number} step={s} active={active === i} />
          ))}
        </div>
        <Image
          src={steps[active].image}
          alt={`Adım ${steps[active].number}`}
          width={368}
          height={736}
          className="mx-auto h-auto w-full max-w-[368px]"
        />
        <div className="flex w-1/3 flex-col gap-y-5">
          {rightSteps.map((s, i) => (
            <StepBox key={s.number} step={s} active={active === half + i} />
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-y-6 lg:hidden">
        <Image
          src={steps[active].image}
          alt={`Adım ${steps[active].number}`}
          width={260}
          height={533}
          className="h-auto w-[220px]"
        />
        <div className="flex max-w-sm items-start gap-x-4">
          <span className="text-3xl font-bold text-vf-red">{steps[active].number}</span>
          <p className="text-lg text-black">{steps[active].text}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-x-4">
        <button type="button" aria-label="Önceki adım" onClick={goPrev} className="rounded-full p-2 hover:bg-gray-100">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        {steps.map((s, i) => (
          <button
            type="button"
            key={s.number}
            aria-label={`Adım ${s.number}`}
            onClick={() => setActive(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === active ? "bg-vf-red" : "bg-gray-300"}`}
          />
        ))}
        <button type="button" aria-label="Sonraki adım" onClick={goNext} className="rounded-full p-2 hover:bg-gray-100">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
