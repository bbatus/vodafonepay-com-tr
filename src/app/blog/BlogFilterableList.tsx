"use client";

import { useState } from "react";
import { ALL_FILTER, FilterTabs, matchesFilter, type FilterTabCategory } from "@/components/FilterTabs";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";

export function BlogFilterableList({
  posts,
  categories,
  allLabel,
}: {
  posts: CardListItem[];
  categories: FilterTabCategory[];
  allLabel?: string;
}) {
  const [active, setActive] = useState<string>(ALL_FILTER);
  const visible = posts.filter((p) => matchesFilter(active, p.category));
  // Same treatment as /sikca-sorulan-sorular: a category tab with zero posts
  // gets an explicit "nothing here yet" message instead of a blank grid that
  // reads as broken. Only for a specific category, not "Tümü".
  const showEmptyState = active !== ALL_FILTER && visible.length === 0;

  return (
    <>
      <div className="my-6">
        <FilterTabs categories={categories} active={active} onChange={setActive} allLabel={allLabel} />
      </div>

      {showEmptyState ? (
        <p className="mx-auto max-w-3xl px-4 pb-16 text-center text-gray-500">Bu kategoride henüz yazı yok.</p>
      ) : (
        <CardListGrid title="Tüm Bloglar" items={visible} // vodafonepay.com.tr uses "Detayları gör" on blog cards too, not
        // "Devamını oku" — checked against the live site.
        linkLabel="Detayları gör" />
      )}
    </>
  );
}
