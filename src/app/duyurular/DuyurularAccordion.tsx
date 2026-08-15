"use client";

import { useState } from "react";
import Link from "next/link";
import { FaqChevronIcon } from "@/components/icons";

export interface Announcement {
  title: string;
  body: React.ReactNode;
  deeplink?: string;
}

/**
 * RFP feedback 5.0 (fallback masking audit): dropped the three hardcoded
 * announcements this fell back to. The `announcements` collection is seeded,
 * so that branch only ever fired on a CMS failure — and an outage then looked
 * exactly like a healthy page carrying stale notices.
 */
export function DuyurularAccordion({ items }: { items: Announcement[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-x-4 rounded bg-white px-5 py-[22px] text-left shadow-[0px_2px_8px_0px_#00000029]"
            >
              <h3 className="font-bold text-black">{item.title}</h3>
              <FaqChevronIcon className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="rounded bg-gray-50 px-5 py-4">
                <div className="text-sm leading-6 text-gray-700">{item.body}</div>
                {item.deeplink && (
                  <Link href={item.deeplink} className="mt-3 inline-block text-sm font-bold text-vf-red hover:underline">
                    Devamını gör →
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
