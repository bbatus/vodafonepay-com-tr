"use client";

import { useState } from "react";
import { ALL_FILTER, FilterTabs, matchesFilter, type FilterTabCategory } from "@/components/FilterTabs";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";

export function CampaignsFilterableList({
  favorites,
  allCampaigns,
  categories,
}: {
  favorites: CardListItem[];
  allCampaigns: CardListItem[];
  categories: FilterTabCategory[];
}) {
  const [active, setActive] = useState<string>(ALL_FILTER);

  const visibleFavorites = favorites.filter((c) => matchesFilter(active, c.category));
  const visibleAll = allCampaigns.filter((c) => matchesFilter(active, c.category));

  return (
    <>
      <div className="my-6">
        <FilterTabs categories={categories} active={active} onChange={setActive} />
      </div>

      {visibleFavorites.length > 0 && <CardListGrid title="Bu ayın favorileri" items={visibleFavorites} />}
      <CardListGrid title="Tüm Kampanyalar" items={visibleAll} />
    </>
  );
}
