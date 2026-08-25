import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { guardPublishedEdit } from "@/collections/Campaigns";
import { ROLES } from "@/access/roles";

/**
 * RFP feedback 5.4: a live campaign must not be editable in place — the editor
 * has to take it off the air first, which sends it back through review. The
 * campaign's `createdAt` (and therefore its position under
 * `defaultSort: "-createdAt"`) is never touched by any of this; Payload only
 * writes that field on insert.
 *
 * Follow-up 25.08: the guard became `async` when the emergency-edit escape
 * hatch was added (it writes an audit entry), so every assertion here is
 * promise-based now. The `forceLiveEdit` cases at the bottom cover the new
 * path — including the one that matters most, that it does NOT hand a Growth
 * Maker the publish right denyMakerPublish exists to withhold.
 */
const PUBLISHED = { id: 1, _status: "published", title: "Yaz Kampanyası", description: "eski", featured: false };

function req(role: string | undefined, language: "tr" | "en" = "tr") {
  return {
    user: role ? { role } : undefined,
    i18n: { language },
    // The emergency path writes an audit entry; stub just enough for it.
    payload: { create: vi.fn().mockResolvedValue({}) },
    headers: { get: () => undefined },
  } as unknown as PayloadRequest;
}

const run = (data: Record<string, unknown>, role: string | undefined, originalDoc: Record<string, unknown> = PUBLISHED) =>
  guardPublishedEdit({
    data,
    operation: "update",
    originalDoc,
    req: req(role),
    collection: {} as never,
    context: {},
  } as never);

describe("guardPublishedEdit", () => {
  it("blocks a content edit on a live campaign, for every role", async () => {
    for (const role of Object.values(ROLES)) {
      await expect(run({ ...PUBLISHED, description: "yeni" }, role)).rejects.toThrow(/yayında/i);
    }
  });

  it("returns a 409, not an opaque 500", async () => {
    await expect(run({ ...PUBLISHED, title: "değişti" }, ROLES.NEW_VERTICAL_MAKER)).rejects.toMatchObject({ status: 409 });
  });

  it("lets a metadata-only write through (that's how the unpublish request is filed)", async () => {
    await expect(run({ ...PUBLISHED, unpublishRequest: "pending" }, ROLES.GROWTH_MAKER)).resolves.toBeDefined();
  });

  it("lets the roles that can publish take a campaign off the air", async () => {
    for (const role of [ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_CHECKER]) {
      const data = (await run({ ...PUBLISHED, _status: "draft" }, role)) as Record<string, unknown>;
      expect(data._status).toBe("draft");
      // Unpublishing re-enters the review cycle and clears the request that asked for it.
      expect(data.reviewStatus).toBe("pending");
      expect(data.unpublishRequest).toBe("none");
    }
  });

  it("stops a Growth Maker unpublishing on its own — it can only request", async () => {
    await expect(run({ ...PUBLISHED, _status: "draft" }, ROLES.GROWTH_MAKER)).rejects.toThrow(/talep/i);
  });

  it("does not interfere with a draft campaign", async () => {
    const draft = { id: 2, _status: "draft", title: "Taslak", description: "eski" };
    await expect(run({ ...draft, description: "yeni" }, ROLES.GROWTH_MAKER, draft)).resolves.toBeDefined();
  });

  it("never touches createdAt", async () => {
    const original = { ...PUBLISHED, createdAt: "2026-05-01T00:00:00.000Z" };
    const data = (await run({ ...original, _status: "draft" }, ROLES.NEW_VERTICAL_MAKER, original)) as Record<string, unknown>;
    expect(data.createdAt).toBe("2026-05-01T00:00:00.000Z");
  });

  describe("forceLiveEdit (emergency edit)", () => {
    it("lets a role that can unpublish edit a live campaign in place", async () => {
      for (const role of [ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_CHECKER]) {
        const data = (await run({ ...PUBLISHED, description: "acil düzeltme", forceLiveEdit: true }, role)) as Record<
          string,
          unknown
        >;
        expect(data.description).toBe("acil düzeltme");
      }
    });

    it("resets the flag so it can't silently authorize a later save", async () => {
      const data = (await run(
        { ...PUBLISHED, description: "acil", forceLiveEdit: true },
        ROLES.NEW_VERTICAL_MAKER
      )) as Record<string, unknown>;
      expect(data.forceLiveEdit).toBe(false);
    });

    it("does NOT let a Growth Maker skip review — segregation of duties survives the shortcut", async () => {
      await expect(
        run({ ...PUBLISHED, description: "acil", forceLiveEdit: true }, ROLES.GROWTH_MAKER)
      ).rejects.toMatchObject({ status: 403 });
    });
  });
});
