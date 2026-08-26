import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { StepProduct } from "@/types/homepage";

/**
 * RFP feedback 5.0 (fallback masking audit): this section used to fall back to
 * a hardcoded copy of its content whenever the CMS returned nothing, so an
 * outage or an empty collection looked identical to a healthy page and no one
 * could tell the CMS had stopped feeding it. The prop is required now and an
 * empty list renders nothing — see docs for which collections still keep a
 * fallback (the ones with zero rows, where the fallback IS the live content).
 */
export function StepPhones({ steps }: { steps: StepProduct[] }) {
  if (steps.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16 lg:px-0">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-black lg:text-[36px] lg:leading-[40px]">
          Vodafone Pay&apos;de bizi neler bekliyor ?
        </h2>
        <p className="mt-4 text-base text-gray-600">
          Vodafone Pay&apos;in Faturana Yansıt, Vodafone Pay Kart ve Cüzdan ürünleriyle kolay ve güvenli bir
          şekilde alışveriş yapıp yüzlerce TL nakit iade ve indirim kazanabileceğiniz bir dünya sizi bekliyor.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-y-16">
        {steps.map((step, i) => (
          <ScrollReveal
            key={step.title}
            className={`flex flex-col items-center gap-8 lg:flex-row lg:gap-16 ${
              i % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className="w-full max-w-[280px] shrink-0">
              <Image
                src={step.image}
                alt={step.imageAlt}
                width={560}
                height={1150}
                className="h-auto w-full"
              />
            </div>
            <div className="max-w-md text-center lg:text-left">
              <h3 className="text-2xl font-bold text-black">{step.title}</h3>
              <p className="mt-3 text-base text-gray-600">{step.description}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
