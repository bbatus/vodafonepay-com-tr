import type { Payload } from "payload";
import { HAND_BUILT_ROUTES } from "@/lib/contentManagementTabs";

/**
 * RFP follow-up 26.08: "sayfa bileşeni şu an localhost:3000 sayfası bile bizim
 * için bir sayfa olarak tutulmalı, tüm farklı url'leri sayfa olarak saymalı ve
 * listeleyebilmeliyiz."
 *
 * The dashboard's "Sayfalar" KPI used to be `payload.count({collection:"pages"})`
 * — which only ever counted editor-built Pages documents (1 of them), not the
 * ~20 hand-written `src/app/*\/page.tsx` routes that make up most of the actual
 * site, and not the dynamic routes that expand into one real URL per record.
 *
 * A site URL comes from exactly three places, and this module covers all three:
 *
 *   1. STATIC   — a hand-written `src/app/<path>/page.tsx`. Not a Payload
 *                 document, so no query can find it; comes from the
 *                 hand-maintained HAND_BUILT_ROUTES table.
 *   2. CMS      — a `pages` collection document, served by `src/app/[...slug]`
 *                 at `/{slug}`. Editable in the admin.
 *   3. DYNAMIC  — a `[slug]`/`[id]` route that renders one URL per record
 *                 (e.g. `/blog/{slug}` for every blog post). The count here is
 *                 deliberately derived the SAME way the site's own
 *                 `generateStaticParams` derives it, so the number shown is the
 *                 number of URLs actually built, not an approximation.
 *
 * Counts are computed with `overrideAccess: true` because this is a
 * site-inventory readout, not a per-role content listing — every role sees the
 * same site.
 */

export type SitePageSource = "static" | "cms" | "dynamic";

export type SitePageEntry = {
  /** Live site path, e.g. "/blog". For dynamic groups this is the pattern, e.g. "/blog/[slug]". */
  path: string;
  title: string;
  source: SitePageSource;
  /** Admin URL to edit this page, when it is editable in the CMS at all. */
  editHref?: string;
  /**
   * How many real, publicly reachable URLs this row accounts for. 1 for a live
   * page, N for a dynamic pattern, and 0 for a CMS page still in draft — an
   * unpublished page is listed (the editor should see it) but does not yet
   * serve a URL, so it must not inflate the count.
   */
  urlCount: number;
  /** CMS pages only: true when the page has no published version yet. */
  isDraft?: boolean;
};

/**
 * Dynamic route templates and where their URLs come from. `kart-onizleme` is
 * deliberately absent — it is an internal editor preview route, not a public
 * site page.
 */
const DYNAMIC_ROUTES: {
  path: string;
  title: { tr: string; en: string };
  collection: string;
  /**
   * Mirrors the site route's own `generateStaticParams` filter, so the number
   * shown is the number of URLs actually served. Without this a *draft* blog
   * post would inflate the count even though it has no public URL.
   */
  where?: Record<string, unknown>;
}[] = [
  {
    path: "/blog/[slug]",
    title: { tr: "Blog yazısı detayı", en: "Blog post detail" },
    collection: "blog-posts",
    where: { _status: { equals: "published" } },
  },
  {
    path: "/kampanyalar/[slug]",
    title: { tr: "Kampanya detayı", en: "Campaign detail" },
    collection: "campaigns",
    where: { and: [{ _status: { equals: "published" } }, { slug: { exists: true } }] },
  },
  // No drafts on this collection, and the route has no generateStaticParams —
  // every record is reachable at /temsilci/{id}.
  { path: "/temsilci/[id]", title: { tr: "Temsilci detayı", en: "Representative detail" }, collection: "representatives" },
];

/** `/sozlesmeler-ve-formlar/[slug]` expands from rows nested inside ONE legal-page
 *  document (`groups[].documents[]`), not from a collection — mirrors the site's
 *  own generateStaticParams filter (`enabled && source === "page" && slug`). */
async function countContractFormPages(payload: Payload): Promise<number> {
  try {
    const { docs } = await payload.find({
      collection: "legal-pages" as never,
      where: { slug: { equals: "sozlesmeler-ve-formlar" } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const page = docs[0] as unknown as
      | { groups?: { documents?: { enabled?: boolean; source?: string; slug?: string }[] }[] }
      | undefined;
    return (page?.groups ?? []).reduce(
      (sum, group) =>
        sum + (group.documents ?? []).filter((d) => d.enabled && d.source === "page" && d.slug).length,
      0
    );
  } catch {
    return 0;
  }
}

async function safeCount(payload: Payload, collection: string, where?: Record<string, unknown>): Promise<number> {
  try {
    const { totalDocs } = await payload.count({
      collection: collection as never,
      overrideAccess: true,
      ...(where ? { where: where as never } : {}),
    });
    return totalDocs;
  } catch {
    return 0;
  }
}

export async function loadSitePages(payload: Payload, locale: "tr" | "en"): Promise<SitePageEntry[]> {
  const [cmsPages, dynamicCounts, contractFormCount] = await Promise.all([
    payload
      .find({ collection: "pages" as never, limit: 500, depth: 0, sort: "slug", overrideAccess: true })
      .then((r) => r.docs as unknown as { id: string | number; title?: string; slug?: string; _status?: string }[])
      .catch(() => []),
    Promise.all(DYNAMIC_ROUTES.map((r) => safeCount(payload, r.collection, r.where))),
    countContractFormPages(payload),
  ]);

  const cmsEntries: SitePageEntry[] = cmsPages
    .filter((p) => p.slug)
    .map((p) => {
      const isDraft = p._status !== "published";
      return {
        path: `/${p.slug}`,
        title: p.title || `/${p.slug}`,
        source: "cms" as const,
        editHref: `/admin/collections/pages/${p.id}`,
        urlCount: isDraft ? 0 : 1,
        isDraft,
      };
    });

  // A route migrated onto the Pages collection may still linger in the
  // hand-maintained table — the CMS entry is the truthful one, so it wins.
  const cmsPaths = new Set(cmsEntries.map((e) => e.path));
  const staticEntries: SitePageEntry[] = HAND_BUILT_ROUTES.filter((r) => !cmsPaths.has(r.path)).map((r) => ({
    path: r.path,
    title: r.title,
    source: "static" as const,
    urlCount: 1,
  }));

  const dynamicEntries: SitePageEntry[] = [
    ...DYNAMIC_ROUTES.map((r, i) => ({
      path: r.path,
      title: r.title[locale],
      source: "dynamic" as const,
      urlCount: dynamicCounts[i],
    })),
    {
      path: "/sozlesmeler-ve-formlar/[slug]",
      title: locale === "tr" ? "Sözleşme/form detayı" : "Contract/form detail",
      source: "dynamic" as const,
      urlCount: contractFormCount,
    },
  ];

  return [...staticEntries, ...cmsEntries, ...dynamicEntries];
}

/** Total number of real, distinct URLs the site serves today. */
export function countSiteUrls(entries: SitePageEntry[]): number {
  return entries.reduce((sum, e) => sum + e.urlCount, 0);
}
