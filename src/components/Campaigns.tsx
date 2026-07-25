"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
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
  const [active, setActive] = useState(0);
  const campaign = campaigns[active];

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-10">
      <div className="flex flex-col items-center gap-x-20 gap-y-6 lg:flex-row">
        <Image
          src={campaign.image}
          alt={campaign.imageAlt}
          width={200}
          height={220}
          className="h-[220px] w-[200px] shrink-0 rounded-lg object-cover"
        />
        <div className="flex max-w-[750px] flex-col gap-y-4">
          <span className="text-[25px] font-bold leading-8 text-black">{campaign.title}</span>
          <p className="text-base text-gray-600">{campaign.description}</p>
          <a href={campaign.href} className="text-sm font-bold text-[#e60000]">
            Detayları gör
          </a>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-x-4">
        <button
          aria-label="Önceki kampanya"
          onClick={() => setActive((i) => (i - 1 + campaigns.length) % campaigns.length)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        {campaigns.map((c, i) => (
          <button
            key={c.title}
            aria-label={`Kampanya ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === active ? "bg-[#e60000]" : "bg-gray-300"}`}
          />
        ))}
        <button
          aria-label="Sonraki kampanya"
          onClick={() => setActive((i) => (i + 1) % campaigns.length)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
