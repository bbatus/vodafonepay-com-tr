import { describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";
import { loadContentMetrics, formatApprovalDuration } from "@/lib/contentMetrics";

/**
 * `avgApprovalHours` is a proxy metric (see contentMetrics.ts's doc comment):
 * for each publish this month, the nearest PRIOR create/update on the same
 * document is treated as "the edit that got approved". These tests are
 * mostly about that pairing logic, since it's the part with real room to
 * get wrong (matching the wrong document, the wrong direction in time, or
 * double-counting).
 */

type Row = { collectionSlug?: string; documentId?: string; action: string; createdAt: string };

/** A fake `payload.find` that answers either the "publish rows this month" query or a "prior edit" lookup, from one flat table of rows. */
function fakePayload(rows: Row[]) {
  const find = vi.fn(async ({ where, limit }: { where: { and: Record<string, unknown>[] }; limit: number }) => {
    const clauses = where.and;
    const get = (field: string) => clauses.find((c) => field in c)?.[field] as Record<string, unknown> | undefined;
    const actionClause = get("action");
    const createdAtClause = get("createdAt");
    const slugClause = get("collectionSlug") as { equals: string } | undefined;
    const idClause = get("documentId") as { equals: string } | undefined;

    let matched = rows.filter((r) => {
      if (actionClause?.equals && r.action !== actionClause.equals) return false;
      if (actionClause?.in && !(actionClause.in as string[]).includes(r.action)) return false;
      if (createdAtClause?.greater_than_equal && r.createdAt < (createdAtClause.greater_than_equal as string)) return false;
      if (createdAtClause?.less_than && !(r.createdAt < (createdAtClause.less_than as string))) return false;
      if (slugClause && r.collectionSlug !== slugClause.equals) return false;
      if (idClause && r.documentId !== idClause.equals) return false;
      return true;
    });
    matched = [...matched].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { docs: matched.slice(0, limit), totalDocs: matched.length };
  });
  return { find } as unknown as Payload;
}

const inThisMonth = (day: number, hour = 0) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day, hour).toISOString();
};

describe("loadContentMetrics", () => {
  it("counts every publish this month, independent of the sampling cap", async () => {
    const rows: Row[] = Array.from({ length: 5 }, (_, i) => ({
      collectionSlug: "faq-items",
      documentId: String(i),
      action: "publish",
      createdAt: inThisMonth(2),
    }));
    const payload = fakePayload(rows);
    const { publishedThisMonth } = await loadContentMetrics(payload, 2);
    expect(publishedThisMonth).toBe(5);
  });

  it("pairs a publish with its own document's most recent prior edit, and averages the gap", async () => {
    const rows: Row[] = [
      { collectionSlug: "pages", documentId: "1", action: "create", createdAt: inThisMonth(1, 0) },
      { collectionSlug: "pages", documentId: "1", action: "publish", createdAt: inThisMonth(1, 4) }, // 4h gap
      { collectionSlug: "faq-items", documentId: "9", action: "update", createdAt: inThisMonth(2, 0) },
      { collectionSlug: "faq-items", documentId: "9", action: "publish", createdAt: inThisMonth(2, 2) }, // 2h gap
    ];
    const payload = fakePayload(rows);
    const { avgApprovalHours } = await loadContentMetrics(payload);
    expect(avgApprovalHours).toBe(3); // (4 + 2) / 2
  });

  it("uses the edit immediately before publish, not an earlier one further back", async () => {
    const rows: Row[] = [
      { collectionSlug: "pages", documentId: "1", action: "create", createdAt: inThisMonth(1, 0) },
      { collectionSlug: "pages", documentId: "1", action: "update", createdAt: inThisMonth(1, 3) }, // this is the one that should count
      { collectionSlug: "pages", documentId: "1", action: "publish", createdAt: inThisMonth(1, 5) },
    ];
    const payload = fakePayload(rows);
    const { avgApprovalHours } = await loadContentMetrics(payload);
    expect(avgApprovalHours).toBe(2); // 5 - 3, not 5 - 0
  });

  it("never lets one document's edit answer for another document's publish", async () => {
    const rows: Row[] = [
      { collectionSlug: "pages", documentId: "1", action: "update", createdAt: inThisMonth(1, 0) },
      { collectionSlug: "pages", documentId: "2", action: "publish", createdAt: inThisMonth(1, 10) }, // different documentId — no pair
    ];
    const payload = fakePayload(rows);
    const { avgApprovalHours } = await loadContentMetrics(payload);
    expect(avgApprovalHours).toBeNull();
  });

  it("returns null rather than NaN or 0 when nothing was published this month", async () => {
    const payload = fakePayload([]);
    const { publishedThisMonth, avgApprovalHours } = await loadContentMetrics(payload);
    expect(publishedThisMonth).toBe(0);
    expect(avgApprovalHours).toBeNull();
  });

  it("ignores a publish that has no preceding edit at all (e.g. audit history predates the field)", async () => {
    const rows: Row[] = [{ collectionSlug: "pages", documentId: "1", action: "publish", createdAt: inThisMonth(1) }];
    const payload = fakePayload(rows);
    const { avgApprovalHours } = await loadContentMetrics(payload);
    expect(avgApprovalHours).toBeNull();
  });
});

describe("formatApprovalDuration", () => {
  it("formats sub-day durations in hours", () => {
    expect(formatApprovalDuration(3.24, "tr")).toBe("3.2 sa");
    expect(formatApprovalDuration(3.24, "en")).toBe("3.2h");
  });

  it("switches to days+hours past 24h", () => {
    expect(formatApprovalDuration(30, "tr")).toBe("1g 6sa");
    expect(formatApprovalDuration(50, "en")).toBe("2d 2h");
  });
});
