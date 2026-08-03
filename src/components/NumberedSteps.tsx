import { ScrollReveal } from "@/components/ScrollReveal";

export function NumberedSteps({
  heading,
  steps,
}: {
  heading: string;
  steps: { title: string; description: string }[];
}) {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <h2 className="text-center text-2xl font-bold text-black lg:text-4xl">{heading}</h2>
      <div className="mx-auto mt-10 grid max-w-3xl gap-8 sm:grid-cols-3">
        {steps.map((step, i) => (
          <ScrollReveal key={step.title} className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e60000] text-lg font-bold text-white">
              {i + 1}
            </div>
            <h3 className="mt-4 text-lg font-bold text-black">{step.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{step.description}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
