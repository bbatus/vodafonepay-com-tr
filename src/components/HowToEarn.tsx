import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";

export interface EarnStep {
  icon: string;
  title: string;
  description: string;
}

export function HowToEarn({
  heading,
  image,
  steps,
  invertIcons = true,
}: {
  heading: string;
  image: string;
  steps: EarnStep[];
  invertIcons?: boolean;
}) {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <h2 className="text-center text-2xl font-bold text-black lg:text-left lg:text-4xl">{heading}</h2>

      <div className="mt-10 flex flex-col items-center lg:flex-row lg:items-start">
        <div className="order-2 flex flex-col lg:order-1 lg:w-[350px]">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} className="flex gap-x-6">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${invertIcons ? "bg-vf-red" : ""}`}
                >
                  <Image
                    src={step.icon}
                    alt={step.title}
                    width={32}
                    height={32}
                    className={invertIcons ? "h-8 w-8 invert" : "h-[72px] w-[72px]"}
                  />
                </div>
                {i < steps.length - 1 && <div className="my-1 h-full w-px flex-1 bg-gray-300" />}
              </div>
              <div className="pb-10">
                <h3 className="text-xl font-bold text-black">{step.title}</h3>
                <p className="mt-1 text-base text-gray-600">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="order-1 mb-8 shrink-0 lg:order-2 lg:mb-0 lg:ml-[165px]">
          <Image src={image} alt={heading} width={280} height={575} className="h-auto w-[220px] lg:w-[280px]" />
        </div>
      </div>
    </section>
  );
}
