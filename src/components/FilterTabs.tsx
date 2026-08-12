"use client";

export const filterCategories = ["Tümü", "Anında Bakiye", "Faturana Yansıt", "Kart"] as const;
export type FilterCategory = (typeof filterCategories)[number];

/** Maps CMS category values (Campaigns.category, free-text BlogPosts.category) to filter tab labels. */
const CMS_CATEGORY_TO_FILTER: Record<string, FilterCategory> = {
  "aninda-bakiye": "Anında Bakiye",
  "faturana-yansit": "Faturana Yansıt",
  kart: "Kart",
};

export function matchesFilter(active: FilterCategory, category: string | undefined): boolean {
  if (active === "Tümü") return true;
  if (!category) return false;
  return CMS_CATEGORY_TO_FILTER[category] === active;
}

export function FilterTabs({
  active,
  onChange,
}: {
  active: FilterCategory;
  onChange: (value: FilterCategory) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {filterCategories.map((f) => (
        <button
          type="button"
          key={f}
          onClick={() => onChange(f)}
          className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
            active === f ? "border-vf-navy bg-vf-navy text-white" : "border-gray-300 bg-white text-black hover:bg-gray-50"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
