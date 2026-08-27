import Image from "next/image";

export function LeadFormCta() {
  return (
    <section className="mx-auto w-full max-w-[1030px] px-4 py-8">
      <div
        className="flex items-center justify-center gap-x-6 rounded-md bg-cover bg-center px-6 py-7"
        style={{ backgroundImage: "url(/images/leadform-banner.svg)" }}
      >
        <Image src="/images/leadform-icon.svg" alt="" width={64} height={64} className="h-16 w-16 shrink-0" />
        <div className="flex w-full max-w-[300px] flex-col items-center gap-y-4 text-center text-white">
          <p className="text-sm font-bold">
            Vodafone Pay ile Faturana Yansıt üye işyerimiz olun, Vodafone Pay avantajlarından yararlanın.
          </p>
          <button
            type="button"
            className="w-full max-w-[160px] rounded-md bg-vf-red px-4 py-2 text-center text-sm font-bold text-white transition-opacity hover:opacity-80"
          >
            Formu doldurun
          </button>
        </div>
      </div>
    </section>
  );
}
