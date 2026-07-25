import Image from "next/image";

export function Hero() {
  return (
    <section className="px-0 lg:px-8 lg:pt-4">
      <div className="relative overflow-hidden lg:rounded-xl">
        <Image
          src="/images/hero-spotlight.jpg"
          alt="Vodafone Pay"
          width={1440}
          height={420}
          priority
          className="h-[280px] w-full object-cover lg:h-[420px]"
        />
        <div className="absolute bottom-8 left-6 hidden lg:block">
          <p className="font-bold text-2xl leading-tight text-white">Vodafone Pay</p>
          <p className="font-bold text-2xl leading-tight text-white">Ödemenin Akıllı Hali</p>
        </div>
      </div>
      <div className="bg-[#f3f4f6] px-6 py-10 text-center lg:hidden">
        <p className="text-3xl font-bold leading-tight text-black">Vodafone Pay</p>
        <p className="text-3xl font-bold leading-tight text-black">Ödemenin Akıllı Hali</p>
      </div>
    </section>
  );
}
