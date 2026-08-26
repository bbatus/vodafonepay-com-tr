import { describe, expect, it } from "vitest";
import type { Payload } from "payload";
import { countSiteUrls, loadSitePages } from "@/lib/sitePages";
import { HAND_BUILT_ROUTES } from "@/lib/contentManagementTabs";

/**
 * A stand-in for the parts of `payload` that loadSitePages touches. Each test
 * declares only what it needs; anything unspecified behaves like an empty
 * collection, which is also the shape the real thing returns on a fresh DB.
 */
function fakePayload(opts: {
  pages?: { id: number; title?: string; slug?: string; _status?: string }[];
  counts?: Record<string, number>;
  legalDocuments?: { enabled?: boolean; source?: string; slug?: string }[];
  throwOn?: string;
}): Payload {
  const counts = opts.counts ?? {};
  return {
    find: async ({ collection }: { collection: string }) => {
      if (collection === opts.throwOn) throw new Error("boom");
      if (collection === "pages") return { docs: opts.pages ?? [] };
      if (collection === "legal-pages") {
        return { docs: [{ groups: [{ documents: opts.legalDocuments ?? [] }] }] };
      }
      return { docs: [] };
    },
    count: async ({ collection }: { collection: string }) => {
      if (collection === opts.throwOn) throw new Error("boom");
      return { totalDocs: counts[collection] ?? 0 };
    },
  } as unknown as Payload;
}

describe("loadSitePages", () => {
  it("counts the hand-built routes the CMS can never query, not just Pages documents", async () => {
    const entries = await loadSitePages(fakePayload({}), "tr");
    const staticEntries = entries.filter((e) => e.source === "static");

    // The whole point of the feature: the homepage "/" is a real page too.
    expect(staticEntries.some((e) => e.path === "/")).toBe(true);
    expect(staticEntries).toHaveLength(HAND_BUILT_ROUTES.length);
  });

  it("expands a dynamic route into one URL per published record", async () => {
    const entries = await loadSitePages(
      fakePayload({ counts: { "blog-posts": 5, campaigns: 20, representatives: 0 } }),
      "tr"
    );

    expect(entries.find((e) => e.path === "/blog/[slug]")?.urlCount).toBe(5);
    expect(entries.find((e) => e.path === "/kampanyalar/[slug]")?.urlCount).toBe(20);
    // A collection with no records still gets a row, so the editor can see the
    // route exists and is simply empty.
    expect(entries.find((e) => e.path === "/temsilci/[id]")?.urlCount).toBe(0);
  });

  it("totals static + CMS + dynamic URLs", async () => {
    const entries = await loadSitePages(
      fakePayload({
        pages: [{ id: 1, title: "Uygulama", slug: "vodafone-pay-uygulama", _status: "published" }],
        counts: { "blog-posts": 5, campaigns: 20 },
      }),
      "tr"
    );

    expect(countSiteUrls(entries)).toBe(HAND_BUILT_ROUTES.length + 1 + 5 + 20);
  });

  it("lists a draft CMS page but does not count it as a live URL", async () => {
    const entries = await loadSitePages(
      fakePayload({ pages: [{ id: 7, title: "Yeni sayfa", slug: "yeni-sayfa", _status: "draft" }] }),
      "tr"
    );
    const draft = entries.find((e) => e.path === "/yeni-sayfa");

    expect(draft).toBeDefined();
    expect(draft?.isDraft).toBe(true);
    expect(draft?.urlCount).toBe(0);
    expect(countSiteUrls(entries)).toBe(HAND_BUILT_ROUTES.length);
  });

  it("lets a published CMS page win over a stale hand-built row for the same path", async () => {
    const migrated = HAND_BUILT_ROUTES[1];
    const entries = await loadSitePages(
      fakePayload({
        pages: [{ id: 2, title: migrated.title, slug: migrated.path.replace(/^\//, ""), _status: "published" }],
      }),
      "tr"
    );
    const matching = entries.filter((e) => e.path === migrated.path);

    expect(matching).toHaveLength(1);
    expect(matching[0].source).toBe("cms");
    expect(matching[0].editHref).toBe("/admin/collections/pages/2");
  });

  it("only counts contract/form rows that actually produce a page URL", async () => {
    const entries = await loadSitePages(
      fakePayload({
        legalDocuments: [
          { enabled: true, source: "page", slug: "uyelik-sozlesmesi" },
          // A PDF link is not a page — this is the real production shape today.
          { enabled: true, source: "pdf" },
          // Disabled rows are filtered out by the site's own generateStaticParams.
          { enabled: false, source: "page", slug: "eski-form" },
        ],
      }),
      "tr"
    );

    expect(entries.find((e) => e.path === "/sozlesmeler-ve-formlar/[slug]")?.urlCount).toBe(1);
  });

  it("degrades to 0 instead of breaking the whole dashboard when a query fails", async () => {
    const entries = await loadSitePages(fakePayload({ throwOn: "campaigns" }), "tr");

    expect(entries.find((e) => e.path === "/kampanyalar/[slug]")?.urlCount).toBe(0);
    expect(entries.some((e) => e.source === "static")).toBe(true);
  });

  it("localises the dynamic route titles", async () => {
    const tr = await loadSitePages(fakePayload({}), "tr");
    const en = await loadSitePages(fakePayload({}), "en");

    expect(tr.find((e) => e.path === "/blog/[slug]")?.title).toBe("Blog yazısı detayı");
    expect(en.find((e) => e.path === "/blog/[slug]")?.title).toBe("Blog post detail");
  });
});
