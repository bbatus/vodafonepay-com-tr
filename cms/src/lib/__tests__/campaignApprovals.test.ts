import { describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";
import { loadApprovalCounts, loadOwnDrafts, loadPendingCampaigns } from "@/lib/campaignApprovals";

/**
 * These three feed the dashboard widgets both roles land on at login — the
 * Checker's "İncelemeni Bekleyen Kampanyalar" and the Maker's "Taslaklarınız".
 * The file had no tests at all (0% at the 29.08 coverage run), which matters
 * more than the percentage suggests: the queries encode two non-obvious
 * decisions that a refactor would quietly undo.
 *
 * First, both list functions use `findVersions`, not `find` with `draft: true`.
 * The base `campaigns` table only ever reflects the latest PUBLISH, so a
 * Maker's resubmitted draft is invisible there, and `denyUnauthenticatedDraftRead`
 * blocks the unauthenticated Local API call these make. Second, the counts read
 * `audit-logs` rather than campaign state, because "how many were approved" is
 * a history question that current status cannot answer.
 */
function fakePayload(overrides: Partial<Record<"count" | "findVersions", unknown>> = {}) {
  return {
    count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
    findVersions: vi.fn().mockResolvedValue({ docs: [] }),
    ...overrides,
  } as unknown as Payload & { count: ReturnType<typeof vi.fn>; findVersions: ReturnType<typeof vi.fn> };
}

describe("loadApprovalCounts", () => {
  it("counts publish / rejected / create audit rows scoped to campaigns", async () => {
    const payload = fakePayload({
      count: vi
        .fn()
        .mockResolvedValueOnce({ totalDocs: 7 })
        .mockResolvedValueOnce({ totalDocs: 2 })
        .mockResolvedValueOnce({ totalDocs: 11 }),
    });

    expect(await loadApprovalCounts(payload)).toEqual({ approved: 7, rejected: 2, total: 11 });

    const actions = payload.count.mock.calls.map((c) => c[0].where.and[0].action.equals);
    expect(actions).toEqual(["publish", "rejected", "create"]);
    for (const call of payload.count.mock.calls) {
      expect(call[0].collection).toBe("audit-logs");
      expect(call[0].where.and[1].collectionSlug.equals).toBe("campaigns");
      // Unauthenticated Local API call — without this the counts come back 0.
      expect(call[0].overrideAccess).toBe(true);
    }
  });

  it("reports zeros rather than throwing when nothing has happened yet", async () => {
    expect(await loadApprovalCounts(fakePayload())).toEqual({ approved: 0, rejected: 0, total: 0 });
  });
});

describe("loadPendingCampaigns", () => {
  it("asks for the latest draft version of every campaign pending review", async () => {
    const payload = fakePayload();
    await loadPendingCampaigns(payload);

    const [args] = payload.findVersions.mock.calls[0];
    expect(args.collection).toBe("campaigns");
    expect(args.where.and).toEqual([
      { latest: { equals: true } },
      { "version._status": { equals: "draft" } },
      { "version.reviewStatus": { equals: "pending" } },
    ]);
    // depth 1 so `createdBy` arrives as a user object with an email on it.
    expect(args.depth).toBe(1);
    expect(args.overrideAccess).toBe(true);
  });

  it("maps a version row onto the parent campaign's id, title and author", async () => {
    const payload = fakePayload({
      findVersions: vi.fn().mockResolvedValue({
        docs: [{ parent: 14, version: { title: "Yaz Kampanyası", createdBy: { email: "ece.boran@vodafone.com" } } }],
      }),
    });

    expect(await loadPendingCampaigns(payload)).toEqual([
      { id: 14, title: "Yaz Kampanyası", createdByEmail: "ece.boran@vodafone.com" },
    ]);
  });

  /** A relationship left at depth 0, or never set, must not crash the dashboard. */
  it("leaves the author undefined when createdBy is an id or missing", async () => {
    const payload = fakePayload({
      findVersions: vi.fn().mockResolvedValue({
        docs: [
          { parent: 1, version: { title: "A", createdBy: 12 } },
          { parent: 2, version: { title: "B", createdBy: null } },
          { parent: 3, version: {} },
        ],
      }),
    });

    expect(await loadPendingCampaigns(payload)).toEqual([
      { id: 1, title: "A", createdByEmail: undefined },
      { id: 2, title: "B", createdByEmail: undefined },
      // No title on the version — falls back to the id so the row is still clickable.
      { id: 3, title: "3", createdByEmail: undefined },
    ]);
  });

  it("passes the caller's limit through", async () => {
    const payload = fakePayload();
    await loadPendingCampaigns(payload, 5);
    expect(payload.findVersions.mock.calls[0][0].limit).toBe(5);
  });
});

describe("loadOwnDrafts", () => {
  it("scopes to the asking user's own drafts, whatever their review status", async () => {
    const payload = fakePayload();
    await loadOwnDrafts(payload, 12);

    const [args] = payload.findVersions.mock.calls[0];
    expect(args.where.and).toEqual([
      { latest: { equals: true } },
      { "version._status": { equals: "draft" } },
      { "version.createdBy": { equals: 12 } },
    ]);
    // No reviewStatus filter here on purpose: a Maker needs to see their
    // REJECTED drafts too, which is the whole point of the widget.
    expect(JSON.stringify(args.where)).not.toContain("reviewStatus");
  });

  it("carries the rejection reason through so the Maker can act on it", async () => {
    const payload = fakePayload({
      findVersions: vi.fn().mockResolvedValue({
        docs: [
          {
            parent: 23,
            version: { title: "Ulaşım Kampanyası", reviewStatus: "rejected", rejectionReason: "Katılım koşulları boş." },
          },
          { parent: 24, version: { title: "Bekleyen", reviewStatus: "pending" } },
        ],
      }),
    });

    expect(await loadOwnDrafts(payload, 12)).toEqual([
      { id: 23, title: "Ulaşım Kampanyası", reviewStatus: "rejected", rejectionReason: "Katılım koşulları boş." },
      { id: 24, title: "Bekleyen", reviewStatus: "pending", rejectionReason: undefined },
    ]);
  });

  it("returns an empty list when the Maker has no drafts", async () => {
    expect(await loadOwnDrafts(fakePayload(), 99)).toEqual([]);
  });
});
