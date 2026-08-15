"use client";

import { useListQuery } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

type MediaTypeFilter = "all" | "image" | "video";

/**
 * RFP feedback C1: Tümü/Görseller/Videolar tabs above the Media list,
 * filtering by the `mediaType` field (Media.ts, auto-derived from
 * mimeType — never user-set). Uses Payload's own ListQuery context
 * (handleWhereChange) instead of hand-building `?where[...]` URLs, so it
 * stays in sync with whatever else the list view's own filter UI sets.
 */
export default function MediaFilterTabs() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { handleWhereChange, query } = useListQuery();

  const where = query?.where as { mediaType?: { equals?: string } } | undefined;
  const activeFilterValue = where?.mediaType?.equals;
  let active: MediaTypeFilter = "all";
  if (activeFilterValue === "image" || activeFilterValue === "video") {
    active = activeFilterValue;
  }

  const setFilter = (filter: MediaTypeFilter) => {
    if (!handleWhereChange) return;
    void handleWhereChange(filter === "all" ? {} : { mediaType: { equals: filter } });
  };

  const tabs: { key: MediaTypeFilter; label: string }[] = [
    { key: "all", label: t("mediaFilterTabs.all") },
    { key: "image", label: t("mediaFilterTabs.images") },
    { key: "video", label: t("mediaFilterTabs.videos") },
  ];

  return (
    <div className="media-filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`media-filter-tabs__tab${active === tab.key ? " media-filter-tabs__tab--active" : ""}`}
          onClick={() => setFilter(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
