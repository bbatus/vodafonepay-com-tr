import Image from "next/image";

const brands = [
  { name: "Spotify", logo: "/images/logo-spotify.svg" },
  { name: "Youtube Premium", logo: "/images/logo-youtube.svg" },
  { name: "Google Play", logo: "/images/logo-googleplay.svg" },
  { name: "Netflix", logo: "/images/logo-netflix.svg" },
  { name: "Biletinial", logo: "/images/logo-biletinial.png" },
  { name: "Starbucks", logo: "/images/logo-starbucks.png" },
  { name: "App Store", logo: "/images/logo-appstore.png" },
  { name: "Hayat Su", logo: "/images/logo-hayatsu.png" },
  { name: "Tıkla Gelsin", logo: "/images/logo-tiklagelsin.png" },
];

export function BrandLogoGrid() {
  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <div className="rounded-lg bg-white p-6 shadow-[0px_2px_12px_0px_#00000014] lg:p-10">
        <h2 className="text-xl font-bold text-black lg:text-2xl">Nerelerde kullanabilirim?</h2>
        <div className="mt-8 grid grid-cols-3 gap-6 sm:grid-cols-5">
          {brands.map((b) => (
            <div key={b.name} className="flex h-16 items-center justify-center">
              <Image src={b.logo} alt={b.name} width={80} height={40} className="h-auto max-h-10 w-auto max-w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
