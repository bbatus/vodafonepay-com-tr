"use client";

import { useState } from "react";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Faq } from "@/components/Faq";
import { ALL_FILTER, FilterTabs, matchesFilter, type FilterTabCategory } from "@/components/FilterTabs";

type FaqEntry = { question: string; answer: string; category?: string };

/**
 * FaqItems.category used to be a hardcoded `select` in the CMS, mirrored by
 * a hardcoded tab list + label map here (RFP feedback 1.3, same problem
 * /kampanyalar and /blog had before their own Categories migration). Now
 * it's the same Categories relationship, and this reuses the SAME FilterTabs
 * component those two pages already use — a category the CMS doesn't know
 * about simply can't produce a tab.
 */
export function FaqCategoryFilter({
  items,
  categories,
  allLabel,
}: {
  items?: FaqEntry[];
  categories: FilterTabCategory[];
  allLabel?: string;
}) {
  const [active, setActive] = useState<string>(ALL_FILTER);
  const visible = (items ?? []).filter((i) => matchesFilter(active, i.category));

  // Every category is a tab now even with zero questions in it (see
  // page.tsx) — <Faq> itself renders nothing for an empty list, which read
  // as "this tab is broken" rather than "empty on purpose". Only shown for
  // a specific category tab, not "Tümü": an empty site-wide FAQ is the
  // ContentUnavailable-style CMS-outage case other pages already handle
  // above this component, not something to duplicate here.
  const showEmptyState = active !== ALL_FILTER && visible.length === 0;

  return (
    <>
      <StickyQr />
      <Breadcrumb current="Sıkça Sorulan Sorular" />

      <section className="mx-auto w-full max-w-[1030px] px-4 pb-10 pt-6">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Sıkça Sorulan Sorular</h1>
        <div className="mt-8">
          <FilterTabs categories={categories} active={active} onChange={setActive} allLabel={allLabel} />
        </div>
      </section>

      {showEmptyState ? (
        <p className="mx-auto max-w-3xl px-4 pb-16 text-center text-gray-500">Bu kategoride henüz soru yok.</p>
      ) : (
        <Faq items={visible.map(({ question, answer }) => ({ question, answer }))} showHeading={false} />
      )}
    </>
  );
}
