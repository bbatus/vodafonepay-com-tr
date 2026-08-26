import { describe, expect, it } from "vitest";
import {
  ALL_REPORTED_SLUGS,
  HAND_BUILT_ROUTES,
  REPORT_COLLECTIONS,
  SITE_ROUTES_TAB_SLUG,
  SUMMARY_ONLY_COLLECTIONS,
  hasDrafts,
  tabLabel,
} from "@/lib/contentManagementTabs";

describe("hasDrafts", () => {
  it("is true for a collection with versions.drafts: true", () => {
    expect(hasDrafts("campaigns")).toBe(true);
  });

  it("is false for a collection without drafts, and for an unknown slug", () => {
    expect(hasDrafts("audit-logs")).toBe(false);
    expect(hasDrafts("not-a-real-collection")).toBe(false);
  });
});

describe("tabLabel", () => {
  it("returns the special site-routes label, not a COLLECTION_LABELS lookup", () => {
    expect(tabLabel(SITE_ROUTES_TAB_SLUG, "tr")).toBe("Site Sayfaları (geliştirici yapımı)");
    expect(tabLabel(SITE_ROUTES_TAB_SLUG, "en")).toBe("Site Pages (developer-built)");
  });

  it("looks up a real collection's label by locale", () => {
    expect(tabLabel("campaigns", "tr")).toBe("Kampanyalar");
    expect(tabLabel("campaigns", "en")).toBe("Campaigns");
  });

  it("falls back to the bare slug for a collection with no label entry", () => {
    expect(tabLabel("not-a-real-collection", "tr")).toBe("not-a-real-collection");
  });
});

describe("ALL_REPORTED_SLUGS", () => {
  it("is exactly REPORT_COLLECTIONS' slugs plus SUMMARY_ONLY_COLLECTIONS, in that order", () => {
    expect(ALL_REPORTED_SLUGS).toEqual([...REPORT_COLLECTIONS.map((c) => c.slug), ...SUMMARY_ONLY_COLLECTIONS]);
  });

  it("has no duplicate slugs", () => {
    expect(new Set(ALL_REPORTED_SLUGS).size).toBe(ALL_REPORTED_SLUGS.length);
  });
});

describe("HAND_BUILT_ROUTES", () => {
  it("is non-empty and every route has a leading-slash path and a title", () => {
    expect(HAND_BUILT_ROUTES.length).toBeGreaterThan(0);
    for (const route of HAND_BUILT_ROUTES) {
      expect(route.path.startsWith("/"), route.path).toBe(true);
      expect(route.title).toBeTruthy();
    }
  });

  it("has no duplicate paths", () => {
    const paths = HAND_BUILT_ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
