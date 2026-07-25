import Image from "next/image";
import type { CampaignCard } from "@/types/homepage";

const campaigns: CampaignCard[] = [
  {
    title: "Vodafone Pay ile Çeşme Plajlarında 1.000 TL Nakit İade!",
    description:
      "Çeşme'de bulunan ALMare, Playa, Fly Inn ve OM Paparazzi plajlarından birinde yapacağın tek seferde 2.000 TL ve üzeri harcamana 1.000 TL nakit iade!",
    image: "/images/campaign-cesme.jpg",
    imageAlt: "Kampanya görseli",
    href: "/kampanyalar",
  },
  {
    title: "1 TL'ye Hayat Su Kapında!",
    description:
      "Hayat Su'da \"Vodafone Pay ile Faturana Yansıt\" ile sipariş ver, damacana su siparişini 1 TL'ye satın alma fırsatını yakala!",
    image: "/images/campaign-hayat-su.jpg",
    imageAlt: "Kampanya görseli",
    href: "/kampanyalar",
  },
  {
    title: "Market Harcamana 100 TL İndirim",
    description: "Market harcamanı ilk kez QR ile faturana yansıt, 100 TL indirim kazan!",
    image: "/images/campaign-market.jpg",
    imageAlt: "Kampanya görseli",
    href: "/kampanyalar",
  },
];

export function Campaigns() {
  return (
    <section className="px-4 py-16 lg:px-16">
      <h2 className="text-center text-3xl font-bold text-black">Kampanyalar</h2>
      <div className="mt-10 flex gap-6 overflow-x-auto pb-2 lg:justify-center">
        {campaigns.map((c) => (
          <a
            key={c.title}
            href={c.href}
            className="w-[280px] shrink-0 overflow-hidden rounded-xl shadow-[0px_2px_8px_0px_#00000029] transition-transform hover:-translate-y-1"
          >
            <Image src={c.image} alt={c.imageAlt} width={280} height={180} className="h-[180px] w-full object-cover" />
            <div className="p-4">
              <h3 className="text-base font-bold text-black">{c.title}</h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">{c.description}</p>
              <span className="mt-3 inline-block text-sm font-bold text-[#e60000]">Detayları gör</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
