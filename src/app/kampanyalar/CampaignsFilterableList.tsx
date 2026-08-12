"use client";

import { useState } from "react";
import { FilterTabs, matchesFilter, type FilterCategory } from "@/components/FilterTabs";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";

export function CampaignsFilterableList({
  favorites,
  allCampaigns,
}: {
  favorites: CardListItem[];
  allCampaigns: CardListItem[];
}) {
  const [active, setActive] = useState<FilterCategory>("Tümü");

  const visibleFavorites = favorites.filter((c) => matchesFilter(active, c.category));
  const visibleAll = allCampaigns.filter((c) => matchesFilter(active, c.category));

  return (
    <>
      <div className="my-6">
        <FilterTabs active={active} onChange={setActive} />
      </div>

      {visibleFavorites.length > 0 && <CardListGrid title="Bu ayın favorileri" items={visibleFavorites} />}
      <CardListGrid title="Tüm Kampanyalar" items={visibleAll} />
    </>
  );
}
