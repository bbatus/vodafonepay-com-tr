"use client";

import { useState } from "react";
import { FilterTabs, matchesFilter, type FilterCategory } from "@/components/FilterTabs";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";

export function BlogFilterableList({ posts }: { posts: CardListItem[] }) {
  const [active, setActive] = useState<FilterCategory>("Tümü");
  const visible = posts.filter((p) => matchesFilter(active, p.category));

  return (
    <>
      <div className="my-6">
        <FilterTabs active={active} onChange={setActive} />
      </div>

      <CardListGrid title="Tüm Bloglar" items={visible} linkLabel="Devamını oku" />
    </>
  );
}
