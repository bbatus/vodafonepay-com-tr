import { describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";
import { loadOwnPendingDrafts, loadPendingApprovals } from "@/lib/approvalQueue";

/**
 * This module is what makes the two dashboard widgets tell the truth. Before
 * it they queried `campaigns` and nothing else, so a Maker could send a page,
 * an FAQ or a fee row for approval and neither role's dashboard mentioned it.
 *
 * The tests that matter here are therefore about breadth and about the two
 * places breadth goes wrong: the Campaigns-only `reviewStatus` rule, and the
 * three collections whose own admin route 404s.
 */

/** Returns one draft version row per collection, tagged so we can tell them apart. */
function fakePayload(rowsBySlug: Record<string, unknown[]> = {}) {
  const findVersions = vi.fn(async ({ collection }: { collection: string }) => ({
    docs: rowsBySlug[collection] ?? [],
  }));
  return { findVersions } as unknown as Payload & { findVersions: ReturnType<typeof vi.fn> };
}

const SCOPE = ["campaigns", "pages", "faq-items", "fee-rows", "media", "users"];

describe("loadPendingApprovals", () => {
  it("asks every drafts-enabled collection in scope, and skips the ones without drafts", async () => {
    const payload = fakePayload();
    await loadPendingApprovals(payload, SCOPE, "tr");

    const asked = payload.findVersions.mock.calls.map((c) => c[0].collection).sort();
    expect(asked).toEqual(["campaigns", "faq-items", "fee-rows", "pages"]);
    // media and users have no drafts — querying versions there would throw.
    expect(asked).not.toContain("media");
    expect(asked).not.toContain("users");
  });

  it("only counts the latest draft version, and reads it with overrideAccess", async () => {
    const payload = fakePayload();
    await loadPendingApprovals(payload, ["pages"], "tr");

    const [args] = payload.findVersions.mock.calls[0];
    expect(args.where.and).toEqual(
      expect.arrayContaining([{ latest: { equals: true } }, { "version._status": { equals: "draft" } }])
    );
    // Unauthenticated Local API call — denyUnauthenticatedDraftRead blocks a
    // plain read, and depth 1 is what turns createdBy into an email.
    expect(args.overrideAccess).toBe(true);
    expect(args.depth).toBe(1);
  });

  /**
   * Campaigns is the only collection with its own review cycle. A REJECTED
   * campaign is back with its Maker, so it must not sit in a Checker's queue —
   * while a draft in any other collection is, by itself, waiting.
   */
  it("filters Campaigns to reviewStatus=pending and adds no such filter elsewhere", async () => {
    const payload = fakePayload();
    await loadPendingApprovals(payload, ["campaigns", "pages"], "tr");

    const call = (slug: string) => payload.findVersions.mock.calls.find((c) => c[0].collection === slug)![0];
    expect(JSON.stringify(call("campaigns").where)).toContain("reviewStatus");
    expect(JSON.stringify(call("pages").where)).not.toContain("reviewStatus");
  });

  it("labels each row with its collection and titles it from that collection's own title field", async () => {
    const payload = fakePayload({
      campaigns: [{ parent: 1, updatedAt: "2026-08-29T10:00:00.000Z", version: { title: "Yaz Kampanyası", reviewStatus: "pending" } }],
      // FAQ items are titled by `question`, not `title`.
      "faq-items": [{ parent: 7, updatedAt: "2026-08-29T11:00:00.000Z", version: { question: "Bakiye ne zaman geçer?" } }],
      "cookie-rows": [{ parent: 9, updatedAt: "2026-08-29T09:00:00.000Z", version: { name: "_vfpay_session" } }],
    });

    const items = await loadPendingApprovals(payload, ["campaigns", "faq-items", "cookie-rows"], "tr");

    expect(items.map((i) => i.title)).toEqual(["Bakiye ne zaman geçer?", "Yaz Kampanyası", "_vfpay_session"]);
    expect(items.map((i) => i.collectionSlug)).toEqual(["faq-items", "campaigns", "cookie-rows"]);
    expect(items.every((i) => i.collectionLabel && i.collectionLabel !== i.collectionSlug)).toBe(true);
  });

  it("orders the queue newest first, across collections", async () => {
    const payload = fakePayload({
      campaigns: [{ parent: 1, updatedAt: "2026-08-01T00:00:00.000Z", version: { title: "Eski", reviewStatus: "pending" } }],
      pages: [{ parent: 2, updatedAt: "2026-08-29T00:00:00.000Z", version: { title: "Yeni" } }],
    });
    const items = await loadPendingApprovals(payload, ["campaigns", "pages"], "tr");
    expect(items.map((i) => i.title)).toEqual(["Yeni", "Eski"]);
  });

  /**
   * fee-rows, limit-tables and documents are `admin.hidden`, so
   * /admin/collections/<slug>/<id> genuinely 404s. A queue row linking there
   * would drop the Checker on an error page.
   */
  it("points hidden collections at the screen that can actually edit them", async () => {
    const payload = fakePayload({
      "fee-rows": [{ parent: 19, version: { label: "Ulaşım Kartı Bakiye İadesi" } }],
      "limit-tables": [{ parent: 10, version: { title: "Limit tablosu" } }],
      documents: [{ parent: 3, version: { filename: "sozlesme.pdf" } }],
      pages: [{ parent: 17, version: { title: "Bir sayfa" } }],
    });

    const bySlug = Object.fromEntries(
      (await loadPendingApprovals(payload, ["fee-rows", "limit-tables", "documents", "pages"], "tr")).map((i) => [i.collectionSlug, i.href])
    );

    expect(bySlug["fee-rows"]).toBe("/admin/fees-and-limits");
    expect(bySlug["limit-tables"]).toBe("/admin/fees-and-limits");
    expect(bySlug["documents"]).toBe("/admin/collections/legal-pages");
    expect(bySlug["pages"]).toBe("/admin/collections/pages/17");
  });

  it("surfaces the author when depth resolved them, and copes when it did not", async () => {
    const payload = fakePayload({
      pages: [
        { parent: 1, version: { title: "A", createdBy: { email: "ece.boran@vodafone.com" } } },
        { parent: 2, version: { title: "B", createdBy: 12 } },
        { parent: 3, version: { title: "C" } },
      ],
    });
    const items = await loadPendingApprovals(payload, ["pages"], "tr");
    expect(items.map((i) => i.createdByEmail)).toEqual(["ece.boran@vodafone.com", undefined, undefined]);
  });

  it("falls back to the id when a draft has no title yet, so the row stays clickable", async () => {
    const payload = fakePayload({ pages: [{ parent: 42, version: {} }] });
    const [item] = await loadPendingApprovals(payload, ["pages"], "tr");
    expect(item.title).toBe("#42");
    expect(item.href).toBe("/admin/collections/pages/42");
  });

  /** One collection mid-migration must not take the whole dashboard down. */
  it("keeps going when a single collection's version query throws", async () => {
    const payload = {
      findVersions: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === "campaigns") throw new Error("no versions table");
        return { docs: [{ parent: 5, version: { title: "Hâlâ burada" } }] };
      }),
    } as unknown as Payload;

    const items = await loadPendingApprovals(payload, ["campaigns", "pages"], "tr");
    expect(items.map((i) => i.title)).toEqual(["Hâlâ burada"]);
  });

  it("returns an empty queue when nothing is waiting", async () => {
    expect(await loadPendingApprovals(fakePayload(), SCOPE, "tr")).toEqual([]);
  });
});

describe("loadOwnPendingDrafts", () => {
  it("scopes to the asking Maker across every drafts-enabled collection in scope", async () => {
    const payload = fakePayload();
    await loadOwnPendingDrafts(payload, 12, SCOPE, "tr");

    const asked = payload.findVersions.mock.calls.map((c) => c[0].collection).sort();
    expect(asked).toEqual(["campaigns", "faq-items", "fee-rows", "pages"]);
    for (const call of payload.findVersions.mock.calls) {
      expect(call[0].where.and).toEqual(expect.arrayContaining([{ "version.createdBy": { equals: 12 } }]));
    }
  });

  /**
   * No reviewStatus filter here, on purpose and for both kinds of collection:
   * a Maker needs to see their REJECTED campaigns — that is the whole point of
   * the widget — and elsewhere the field does not exist at all.
   */
  it("includes rejected work and carries the reason through", async () => {
    const payload = fakePayload({
      campaigns: [
        { parent: 23, updatedAt: "2026-08-29T12:00:00.000Z", version: { title: "Reddedilen", reviewStatus: "rejected", rejectionReason: "Katılım koşulları boş." } },
      ],
      "faq-items": [{ parent: 7, updatedAt: "2026-08-29T11:00:00.000Z", version: { question: "Bekleyen soru" } }],
    });

    const items = await loadOwnPendingDrafts(payload, 12, ["campaigns", "faq-items"], "tr");

    expect(JSON.stringify(payload.findVersions.mock.calls[0][0].where)).not.toContain("reviewStatus");
    expect(items[0]).toMatchObject({ title: "Reddedilen", reviewStatus: "rejected", rejectionReason: "Katılım koşulları boş." });
    // A plain draft elsewhere has no review status and is still listed.
    expect(items[1]).toMatchObject({ title: "Bekleyen soru", reviewStatus: undefined });
  });

  it("returns nothing when this Maker has no drafts anywhere", async () => {
    expect(await loadOwnPendingDrafts(fakePayload(), 99, SCOPE, "tr")).toEqual([]);
  });
});
