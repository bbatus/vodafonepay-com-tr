import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { StepProduct } from "@/types/homepage";

const steps: StepProduct[] = [
  {
    title: "Vodafone Pay Uygulaması",
    description: "Ödemelerinizi kolayca, hızlı ve güvenle yönetmek için Vodafone Pay yanınızda!",
    image: "/images/step-app.png",
    imageAlt: "Vodafone Pay Uygulaması",
  },
  {
    title: "Faturana Yansıt",
    description:
      "Faturana Yansıt ile yalnızca cep telefonu numaranızı kullanarak indirimli alışverişin keyfini çıkarın!",
    image: "/images/step-faturana-yansit.png",
    imageAlt: "Faturana Yansıt",
  },
  {
    title: "QR ile Faturana Yansıt",
    description:
      "QR ile yapacağınız fiziksel harcamalarınızı Vodafone faturanıza yansıtabilir, üstelik harcama tutarınızdan indirim kazanabilirsiniz.",
    image: "/images/step-qr-faturana-yansit.png",
    imageAlt: "QR ile Faturana Yansıt",
  },
  {
    title: "Anında Bakiye",
    description:
      "Faturana Yansıt limitinizi Vodafone Pay Sanal Kart'ınıza aktararak dilediğiniz yerde harcama yapabilirsiniz.",
    image: "/images/step-aninda-bakiye.png",
    imageAlt: "Anında Bakiye",
  },
  {
    title: "Vodafone Pay Kart",
    description:
      "Vodafone Pay Kart ister online ister fiziksel alışverişlerinizi gerçekleştirebileceğiniz, harcarken kazandıran bir kart.",
    image: "/images/step-vpay-kart.png",
    imageAlt: "Vodafone Pay Kart",
  },
];

export function StepPhones() {
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
