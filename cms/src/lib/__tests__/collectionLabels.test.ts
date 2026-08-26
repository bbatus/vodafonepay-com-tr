import { describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";
import { dbLabel, refreshLabelCache } from "@/lib/collectionLabels";

function fakePayload(rows: { key: string; tr: string; en: string }[] | null): Payload {
  const find = rows
    ? vi.fn().mockResolvedValue({ docs: rows })
    : vi.fn().mockRejectedValue(new Error("db down"));
  return { find } as unknown as Payload;
}

const i18n = (lang: "tr" | "en") => ({ language: lang }) as never;

describe("dbLabel", () => {
  it("uses the hardcoded fallback before the cache is ever populated", async () => {
    // No refreshLabelCache call for this key yet in this test's isolated module state —
    // covered by running before any other test in this file touches the cache.
    const label = dbLabel("collectionLabel.__unused_test_key__.singular", { tr: "Yedek", en: "Fallback" });
    expect(label({ i18n: i18n("tr") } as never)).toBe("Yedek");
    expect(label({ i18n: i18n("en") } as never)).toBe("Fallback");
  });

  it("prefers the DB-cached value once refreshLabelCache has populated it", async () => {
    await refreshLabelCache(
      fakePayload([{ key: "collectionLabel.campaigns.singular", tr: "DB Kampanya", en: "DB Campaign" }])
    );
    const label = dbLabel("collectionLabel.campaigns.singular", { tr: "Kampanya", en: "Campaign" });
    expect(label({ i18n: i18n("tr") } as never)).toBe("DB Kampanya");
    expect(label({ i18n: i18n("en") } as never)).toBe("DB Campaign");
  });

  it("falls back for a key the cache doesn't have, even after a successful refresh", async () => {
    await refreshLabelCache(fakePayload([{ key: "collectionLabel.campaigns.singular", tr: "x", en: "y" }]));
    const label = dbLabel("collectionLabel.never-seeded.singular", { tr: "Yedek", en: "Fallback" });
    expect(label({ i18n: i18n("tr") } as never)).toBe("Yedek");
  });
});

describe("refreshLabelCache", () => {
  it("never throws when the DB read fails — label lookups must keep working on their fallback", async () => {
    await expect(refreshLabelCache(fakePayload(null))).resolves.toBeUndefined();
  });
});
