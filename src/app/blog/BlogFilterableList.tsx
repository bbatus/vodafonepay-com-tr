"use client";

import { useState } from "react";
import { ALL_FILTER, FilterTabs, matchesFilter, type FilterTabCategory } from "@/components/FilterTabs";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";

export function BlogFilterableList({ posts, categories }: { posts: CardListItem[]; categories: FilterTabCategory[] }) {
  const [active, setActive] = useState<string>(ALL_FILTER);
  const visible = posts.filter((p) => matchesFilter(active, p.category));

  return (
    <>
      <div className="my-6">
        <FilterTabs categories={categories} active={active} onChange={setActive} />
      </div>

      <CardListGrid title="Tüm Bloglar" items={visible} linkLabel="Devamını oku" />
    </>
  );
}
