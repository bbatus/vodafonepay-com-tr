"use client";

import { useState } from "react";
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
    <section className="bg-[#f9fafb] px-4 py-16 lg:px-16">
      {showHeading && <h2 className="text-center text-3xl font-bold text-black">Sıkça Sorulan Sorular</h2>}
      <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-y-3">
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
