"use client";

export const ALL_FILTER = "all" as const;

export type FilterTabCategory = { label: string; slug: string };

export function matchesFilter(active: string, category: string | undefined): boolean {
  if (active === ALL_FILTER) return true;
  if (!category) return false;
  return category === active;
}

/**
 * E2: categories are no longer a hardcoded 4-item array — they're passed in
 * from the CMS's Categories collection (ordered by `order`), so adding or
 * renaming a category is a CMS edit, not a code change. `categories` may be
 * empty (CMS unreachable) — the "Tümü" tab still renders so the page isn't
 * left with zero filter UI.
 */
export function FilterTabs({
  categories,
  active,
  onChange,
}: {
  categories: FilterTabCategory[];
  active: string;
  onChange: (value: string) => void;
}) {
  const tabs: FilterTabCategory[] = [{ label: "Tümü", slug: ALL_FILTER }, ...categories];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.slug}
          onClick={() => onChange(tab.slug)}
          className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
            active === tab.slug ? "border-vf-navy bg-vf-navy text-white" : "border-gray-300 bg-white text-black hover:bg-gray-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
