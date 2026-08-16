"use client";

import { useState } from "react";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Faq } from "@/components/Faq";
import type { FaqItem } from "@/types/homepage";

const categories = [
  "Tümü",
  "Anasayfa",
  "Anında Bakiye",
  "Vodafone Pay Uygulama",
  "Kampanyalar",
  "Vodafone Pay Kart",
  "QR ile Faturana Yansıt",
  "Faturana Yansıt",
  "Sözleşmeler ve Formlar",
  "Gizlilik ve Güvenlik",
  "Duyurular",
] as const;

type Category = (typeof categories)[number];

/** Maps the CMS's FaqItems.category select values (see cms/src/collections/FaqItems.ts) to this page's display labels. */
const CMS_CATEGORY_TO_LABEL: Record<string, Exclude<Category, "Tümü">> = {
  anasayfa: "Anasayfa",
  "aninda-bakiye": "Anında Bakiye",
  "vodafone-pay-uygulama": "Vodafone Pay Uygulama",
  kampanyalar: "Kampanyalar",
  "vodafone-pay-kart": "Vodafone Pay Kart",
  "qr-ile-faturana-yansit": "QR ile Faturana Yansıt",
  // FaqItems offers this category in the CMS, but it was missing from this
  // map — and groupByCategory drops anything it can't map (`if (!label)
  // continue`). So an FAQ an editor filed under "Faturana Yansıt" simply
  // never appeared on this page, with nothing anywhere to say why.
  "faturana-yansit": "Faturana Yansıt",
  "sozlesmeler-ve-formlar": "Sözleşmeler ve Formlar",
  "gizlilik-ve-guvenlik": "Gizlilik ve Güvenlik",
  duyurular: "Duyurular",
};

function groupByCategory(items: (FaqItem & { category: string })[]): Record<Exclude<Category, "Tümü">, FaqItem[]> {
  const grouped: Record<string, FaqItem[]> = {};
  for (const { question, answer, category } of items) {
    const label = CMS_CATEGORY_TO_LABEL[category];
    if (!label) continue;
    grouped[label] ??= [];
    grouped[label].push({ question, answer });
  }
  return grouped as Record<Exclude<Category, "Tümü">, FaqItem[]>;
}

export function FaqCategoryFilter({ items }: { items?: (FaqItem & { category: string })[] }) {
  const [active, setActive] = useState<Category>("Tümü");

  // RFP feedback 5.0: faq-items is seeded, so the old ~18-item hardcoded
  // fallback only fired on a CMS failure — masking it completely.
  const faqsByCategory = groupByCategory(items ?? []);
  const visibleCategories = (active === "Tümü" ? categories.slice(1) : [active]) as Exclude<Category, "Tümü">[];

  return (
    <>
      <StickyQr />
      <Breadcrumb current="Sıkça Sorulan Sorular" />

      <section className="mx-auto w-full max-w-[1030px] px-4 pb-10 pt-6">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Sıkça Sorulan Sorular</h1>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                active === c ? "border-vf-navy bg-vf-navy text-white" : "border-gray-300 bg-white text-black hover:bg-gray-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <Faq items={visibleCategories.flatMap((c) => faqsByCategory[c] ?? [])} showHeading={false} />
    </>
  );
}
