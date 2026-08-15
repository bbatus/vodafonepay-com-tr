"use client";

import { useState } from "react";
import { ALL_FILTER, FilterTabs, matchesFilter, type FilterTabCategory } from "@/components/FilterTabs";
import { CardListGrid, type CardListItem } from "@/components/CardListGrid";
import { ContentUnavailable } from "@/components/ContentUnavailable";

export type FilterableCampaign = CardListItem & { featured: boolean };

/**
 * RFP feedback 5.2 — "anında bakiye seçtim, sadece o kategorinin kampanyaları
 * gözükmeli, favoriler kısmı olmamalı".
 *
 * The old version took two PRE-SPLIT arrays (`favorites` = featured,
 * `allCampaigns` = everything else) and filtered each separately. That
 * carried a second bug on top of the reported one: because a featured
 * campaign only ever existed in the `favorites` array, simply dropping the
 * favourites block on a category filter would have made those campaigns
 * vanish from the page entirely. So this takes ONE list and derives both
 * views from it — a campaign can never be in neither.
 *
 * - "Tümü": unchanged — featured campaigns on top under "Bu ayın favorileri",
 *   the rest below. This is the behaviour the user confirmed as correct.
 * - A specific category: one single grid with every campaign in that
 *   category, featured or not, headed by the category's own name.
 */
export function CampaignsFilterableList({
  campaigns,
  categories,
}: {
  campaigns: FilterableCampaign[];
  categories: FilterTabCategory[];
}) {
  const [active, setActive] = useState<string>(ALL_FILTER);

  const visible = campaigns.filter((c) => matchesFilter(active, c.category));
  const isAll = active === ALL_FILTER;
  const activeLabel = categories.find((c) => c.slug === active)?.label;

  const renderResults = () => {
    if (visible.length === 0) return <ContentUnavailable variant="empty" />;
    if (!isAll) {
      return <CardListGrid title={activeLabel ?? "Kampanyalar"} items={visible} />;
    }
    const featured = visible.filter((c) => c.featured);
    const rest = visible.filter((c) => !c.featured);
    return (
      <>
        {featured.length > 0 && <CardListGrid title="Bu ayın favorileri" items={featured} />}
        {rest.length > 0 && <CardListGrid title="Tüm Kampanyalar" items={rest} />}
      </>
    );
  };

  return (
    <>
      <div className="my-6">
        <FilterTabs categories={categories} active={active} onChange={setActive} />
      </div>
      {renderResults()}
    </>
  );
}
