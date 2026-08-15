import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import { guardPublishedEdit } from "@/collections/Campaigns";
import { ROLES } from "@/access/roles";

/**
 * RFP feedback 5.4: a live campaign must not be editable in place — the editor
 * has to take it off the air first, which sends it back through review. The
 * campaign's `createdAt` (and therefore its position under
 * `defaultSort: "-createdAt"`) is never touched by any of this; Payload only
 * writes that field on insert.
 */
const PUBLISHED = { _status: "published", title: "Yaz Kampanyası", description: "eski", featured: false };

function req(role: string | undefined, language: "tr" | "en" = "tr") {
  return { user: role ? { role } : undefined, i18n: { language } } as unknown as PayloadRequest;
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
  it("blocks a content edit on a live campaign, for every role", () => {
    for (const role of Object.values(ROLES)) {
      expect(() => run({ ...PUBLISHED, description: "yeni" }, role)).toThrow(/yayında/i);
    }
  });

  it("returns a 409, not an opaque 500", () => {
    try {
      run({ ...PUBLISHED, title: "değişti" }, ROLES.NEW_VERTICAL_MAKER);
      throw new Error("should have thrown");
    } catch (err) {
      expect((err as { status?: number }).status).toBe(409);
    }
  });

  it("lets a metadata-only write through (that's how the unpublish request is filed)", () => {
    expect(() => run({ ...PUBLISHED, unpublishRequest: "pending" }, ROLES.GROWTH_MAKER)).not.toThrow();
  });

  it("lets the roles that can publish take a campaign off the air", () => {
    for (const role of [ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_CHECKER]) {
      const data = run({ ...PUBLISHED, _status: "draft" }, role) as Record<string, unknown>;
      expect(data._status).toBe("draft");
      // Unpublishing re-enters the review cycle and clears the request that asked for it.
      expect(data.reviewStatus).toBe("pending");
      expect(data.unpublishRequest).toBe("none");
    }
  });

  it("stops a Growth Maker unpublishing on its own — it can only request", () => {
    expect(() => run({ ...PUBLISHED, _status: "draft" }, ROLES.GROWTH_MAKER)).toThrow(/talep/i);
  });

  it("does not interfere with a draft campaign", () => {
    const draft = { _status: "draft", title: "Taslak", description: "eski" };
    expect(() => run({ ...draft, description: "yeni" }, ROLES.GROWTH_MAKER, draft)).not.toThrow();
  });

  it("never touches createdAt", () => {
    const original = { ...PUBLISHED, createdAt: "2026-05-01T00:00:00.000Z" };
    const data = run({ ...original, _status: "draft" }, ROLES.NEW_VERTICAL_MAKER, original) as Record<string, unknown>;
    expect(data.createdAt).toBe("2026-05-01T00:00:00.000Z");
  });
});
