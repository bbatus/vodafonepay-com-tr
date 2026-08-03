import Image from "next/image";

export function WhereCanIBuy() {
  return (
    <section className="bg-[#f9fafb] px-4 py-16">
      <div className="mx-auto max-w-[1030px]">
        <div className="flex justify-center rounded-xl bg-white p-8">
          <Image src="/images/kart-where-icon.svg" alt="Nereden satın alabilirim?" width={400} height={400} className="h-auto w-[320px]" />
        </div>
        <h2 className="mt-8 text-2xl font-bold text-black lg:text-4xl">Nereden satın alabilirim?</h2>
        <p className="mt-4 max-w-2xl text-base text-gray-600">
          Çipli ve temassız yeni Vodafone Pay Fiziksel Kartlarını Vodafone Mağazalarından kolayca satın
          alabilirsiniz. Visa ve TROY logolu kartlarınla tüm fiziksel noktalarda ve online alışverişlerde
          harcamalarınızı gerçekleştirebilirsiniz.
        </p>
      </div>
    </section>
  );
}
