import Image from "next/image";

export function WhereCanIBuy() {
  return (
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      <div className="flex flex-col items-center gap-10 lg:flex-row">
        <div className="flex w-full max-w-[574px] items-center justify-center rounded-md bg-white p-6 shadow-[0px_2px_8px_0px_#00000014]">
          <Image
            src="/images/kart-where-icon.svg"
            alt="Nereden satın alabilirim?"
            width={434}
            height={200}
            className="h-auto w-full"
          />
        </div>
        <div className="w-full lg:w-auto">
          <h2 className="text-2xl font-bold text-black lg:text-4xl">Nereden satın alabilirim?</h2>
          <p className="mt-4 max-w-sm text-base text-gray-600">
            Çipli ve temassız yeni Vodafone Pay Fiziksel Kartlarını Vodafone Mağazalarından kolayca satın
            alabilirsiniz. Visa ve TROY logolu kartlarınla tüm fiziksel noktalarda ve online alışverişlerde
            harcamalarınızı gerçekleştirebilirsiniz.
          </p>
        </div>
      </div>
    </section>
  );
}
