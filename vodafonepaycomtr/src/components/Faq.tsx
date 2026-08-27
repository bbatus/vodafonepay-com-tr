"use client";

import { useState } from "react";
import Link from "next/link";
import { FaqChevronIcon } from "@/components/icons";
import type { FaqItem } from "@/types/homepage";

/**
 * RFP feedback 5.0 (fallback masking audit): this component used to ship a
 * hardcoded 4-question default that any caller got just by omitting `items`.
 * The homepage relied on it, so a CMS outage silently produced a page that
 * looked completely fine while showing content nobody could edit. `items` is
 * required now, and an empty list renders nothing at all rather than
 * substituting copy — the honest signal that FAQs need entering in the CMS.
 */
export function Faq({ items, showHeading = true }: { items: FaqItem[]; showHeading?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    /**
     * Measured against the live `widget_General_FAQs`: the accordion card
     * itself (`bg-white px-5 py-[22px] rounded shadow-[0px_2px_8px_0px_#00000029]`)
     * was already exact, but the frame around it was not — live has NO tinted
     * section background, sits its cards on the same 1030px content column as
     * every other section (ours capped them at max-w-3xl / 768px), spaces them
     * 20px apart, and left-aligns a 28px heading on desktop instead of
     * centring a 30px one.
     */
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      {showHeading && (
        <h2 className="mb-10 text-center text-2xl font-bold leading-tight text-black lg:text-start lg:text-[28px]">
          Sıkça Sorulan Sorular
        </h2>
      )}
      <div className="flex flex-col gap-y-5">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between rounded bg-white px-5 py-[22px] text-left shadow-[0px_2px_8px_0px_#00000029]"
              >
                <h3 className="font-bold text-black">{item.question}</h3>
                <FaqChevronIcon
                  className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="rounded bg-gray-50 px-5 py-4">
                  <p className="text-sm text-gray-700">{item.answer}</p>
                  {item.deeplink && (
                    <Link href={item.deeplink} className="mt-3 inline-block text-sm font-bold text-vf-red hover:underline">
                      Detaylı bilgi →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
