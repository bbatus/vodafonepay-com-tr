import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { REFERENCE_MAP, blockDeleteIfReferenced, findReferences } from "@/hooks/referentialIntegrity";

/**
 * The bug this guards against: deleting a category silently NULLed
 * `campaigns.category_id` on every campaign in it (Postgres FK is ON DELETE
 * SET NULL) even though that field is `required: true`, leaving published
 * campaigns that matched no category filter anywhere.
 */
type FindResult = { totalDocs: number; docs: Record<string, unknown>[] };

function fakeReq(results: Record<string, FindResult>, language: "tr" | "en" = "tr") {
  const find = vi.fn(async ({ collection, where }: { collection: string; where: Record<string, unknown> }) => {
    const path = Object.keys(where)[0];
    return results[`${collection}.${path}`] ?? { totalDocs: 0, docs: [] };
  });
  const create = vi.fn().mockResolvedValue({});
  const findByID = vi.fn().mockResolvedValue({ label: "Kart" });
  return {
    req: {
      user: { email: "nv@vodafonepay.local" },
      i18n: { language },
      payload: { find, create, findByID },
      headers: { get: () => null },
    } as unknown as PayloadRequest,
    find,
    create,
  };
}

describe("REFERENCE_MAP", () => {
  it("covers the media references that live inside Pages' polymorphic blocks", () => {
    // Verified live against the running CMS that Payload's flat `where`
    // resolves both of these paths — the previous round assumed it couldn't
    // and left them uncovered.
    const paths = REFERENCE_MAP.media.map((s) => `${s.collection}.${s.path}`);
    expect(paths).toContain("pages.layout.image");
    expect(paths).toContain("pages.layout.logos.logo");
  });

  it("treats users references as provenance, never as blocking", () => {
    // Blocking on createdBy/rejectedBy/uploadedBy would make it impossible to
    // ever offboard a user who once touched anything.
    expect(REFERENCE_MAP.users.every((s) => !s.blocking)).toBe(true);
  });
});

describe("findReferences", () => {
  it("reports the referencing documents with a link to each", async () => {
    const { req } = fakeReq({
      "campaigns.category": { totalDocs: 2, docs: [{ id: 7, title: "Yaz Kampanyası" }, { id: 9, title: "Kış" }] },
    });
    const hits = await findReferences(req, "categories", 1);

    expect(hits).toHaveLength(1);
    expect(hits[0].total).toBe(2);
    expect(hits[0].samples[0]).toEqual({ title: "Yaz Kampanyası", url: "/admin/collections/campaigns/7" });
  });

  it("fails closed when a blocking probe throws rather than letting the delete through", async () => {
    const req = {
      user: {},
      i18n: { language: "tr" },
      payload: { find: vi.fn().mockRejectedValue(new Error("db down")), findByID: vi.fn(), create: vi.fn() },
      headers: { get: () => null },
    } as unknown as PayloadRequest;

    // categories is referenced by BOTH campaigns and blog-posts; a probe
    // failure on either has to fail closed, not just the first one.
    const hits = await findReferences(req, "categories", 1);
    expect(hits).toHaveLength(REFERENCE_MAP.categories.length);
    expect(hits.every((h) => h.total === -1)).toBe(true);
  });
});

describe("blockDeleteIfReferenced", () => {
  it("blocks the delete and names what has to be fixed first", async () => {
    const { req } = fakeReq({
      "campaigns.category": { totalDocs: 1, docs: [{ id: 7, title: "Yaz Kampanyası" }] },
    });
    const hook = blockDeleteIfReferenced("categories");

    await expect(hook({ req, id: 1, collection: {} as never, context: {} })).rejects.toMatchObject({
      status: 409,
    });
    await expect(hook({ req, id: 1, collection: {} as never, context: {} })).rejects.toThrow(/Yaz Kampanyası/);
  });

  it("allows the delete once nothing references the document any more", async () => {
    const { req } = fakeReq({});
    const hook = blockDeleteIfReferenced("categories");
    await expect(hook({ req, id: 1, collection: {} as never, context: {} })).resolves.toBeUndefined();
  });

  it("allows a user delete but records which fields were orphaned", async () => {
    const { req, create } = fakeReq({
      "campaigns.createdBy": { totalDocs: 3, docs: [{ id: 1, title: "A" }] },
    });
    const hook = blockDeleteIfReferenced("users");

    await expect(hook({ req, id: 4, collection: {} as never, context: {} })).resolves.toBeUndefined();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "audit-logs",
        data: expect.objectContaining({ summary: expect.stringContaining("campaigns.createdBy×3") }),
      })
    );
  });

  it("writes the error in the admin's current language", async () => {
    const { req } = fakeReq(
      { "campaigns.category": { totalDocs: 1, docs: [{ id: 7, title: "Summer" }] } },
      "en"
    );
    const hook = blockDeleteIfReferenced("categories");
    await expect(hook({ req, id: 1, collection: {} as never, context: {} })).rejects.toThrow(/still reference it/);
  });
});
