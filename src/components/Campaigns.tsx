"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { CampaignCard } from "@/types/homepage";

/**
 * RFP feedback 5.0 (fallback masking audit): this section used to fall back to
 * a hardcoded copy of its content whenever the CMS returned nothing, so an
 * outage or an empty collection looked identical to a healthy page and no one
 * could tell the CMS had stopped feeding it. The prop is required now and an
 * empty list renders nothing — see docs for which collections still keep a
 * fallback (the ones with zero rows, where the fallback IS the live content).
 */
export function Campaigns({ campaigns }: { campaigns: CampaignCard[] }) {
  if (campaigns.length === 0) return null;

  const [active, setActive] = useState(0);
  const campaign = campaigns[active];

  if (!campaign) return null;

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
          <a href={campaign.href} className="text-sm font-bold text-vf-red">
            {campaign.linkLabel || "Detayları gör"}
          </a>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-x-4">
        <button
          type="button"
          aria-label="Önceki kampanya"
          onClick={() => setActive((i) => (i - 1 + campaigns.length) % campaigns.length)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        {campaigns.map((c, i) => (
          <button
            type="button"
            key={c.title}
            aria-label={`Kampanya ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === active ? "bg-vf-red" : "bg-gray-300"}`}
          />
        ))}
        <button
          type="button"
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
