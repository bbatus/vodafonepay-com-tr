import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";

const steps = [
  {
    icon: "/images/icon-bakiye-yukle.svg",
    title: "Bakiye Yükle",
    description: "Banka/kredi kartınızdan, EFT ile veya tüm ATM'lerden dilediğiniz kadar bakiye yükleyin.",
  },
  {
    icon: "/images/icon-harca.svg",
    title: "Harca",
    description: "Tüm online ve fiziksel alışverişlerinizi Vodafone Pay Kart ile yapabilirsiniz.",
  },
  {
    icon: "/images/icon-kazan.png",
    title: "Kazan",
    description: "Kampanya kapsamında yaptığınız tüm harcamalardan yüzlerce TL nakit iade kazanın!",
  },
];

export function HowToEarn({ image = "/images/step-nasil-kazanirim.png" }: { image?: string }) {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <h2 className="text-center text-2xl font-bold text-black lg:text-4xl">Vodafone Pay ile Nasıl Kazanırım?</h2>

      <div className="mt-10 flex justify-center">
        <Image src={image} alt="Nasıl Kazanırım" width={280} height={575} className="h-auto w-[220px] lg:w-[280px]" />
      </div>

      <div className="mx-auto mt-10 flex max-w-md flex-col">
        {steps.map((step, i) => (
          <ScrollReveal key={step.title} className="flex gap-x-6">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e60000]">
                <Image src={step.icon} alt={step.title} width={32} height={32} className="h-8 w-8 invert" />
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
    </section>
  );
}
