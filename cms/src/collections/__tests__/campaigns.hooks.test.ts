import { describe, expect, it, vi } from "vitest";
import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from "payload";
import { Campaigns } from "@/collections/Campaigns";
import { ROLES } from "@/access/roles";

const campaignsDelete = Campaigns.access!.delete!;
const setCreatedBy = Campaigns.hooks!.beforeChange![0] as CollectionBeforeChangeHook;
const manageReviewCycle = Campaigns.hooks!.beforeChange![1] as CollectionBeforeChangeHook;
const auditRejection = Campaigns.hooks!.afterChange![2] as CollectionAfterChangeHook;

describe("Campaigns access.delete", () => {
  it("a New Vertical Maker can delete unconditionally", () => {
    const req = { user: { id: 1, role: ROLES.NEW_VERTICAL_MAKER } } as unknown as PayloadRequest;
    expect(campaignsDelete({ req } as never)).toBe(true);
  });

  it("a Growth Maker can only delete their own drafts — returns a scoped Where, not true", () => {
    const req = { user: { id: 42, role: ROLES.GROWTH_MAKER } } as unknown as PayloadRequest;
    const result = campaignsDelete({ req } as never);
    expect(result).toEqual({
      and: [{ _status: { equals: "draft" } }, { createdBy: { equals: 42 } }],
    });
  });

  it("denies a Growth Checker entirely", () => {
    const req = { user: { id: 2, role: ROLES.GROWTH_CHECKER } } as unknown as PayloadRequest;
    expect(campaignsDelete({ req } as never)).toBe(false);
  });

  it("denies an unauthenticated request", () => {
    const req = {} as unknown as PayloadRequest;
    expect(campaignsDelete({ req } as never)).toBe(false);
  });
});

describe("Campaigns setCreatedBy", () => {
  it("stamps createdBy on create when a user is present", () => {
    const data: Record<string, unknown> = {};
    const req = { user: { id: 7 } } as unknown as PayloadRequest;
    const result = setCreatedBy({ data, operation: "create", req } as never);
    expect(result?.createdBy).toBe(7);
  });

  it("never touches createdBy on update", () => {
    const data: Record<string, unknown> = {};
    const req = { user: { id: 7 } } as unknown as PayloadRequest;
    const result = setCreatedBy({ data, operation: "update", req } as never);
    expect(result).not.toHaveProperty("createdBy");
  });
});

describe("Campaigns manageReviewCycle", () => {
  it("resets a Growth Maker's previously-rejected draft back to pending on resubmit", () => {
    const data: Record<string, unknown> = { title: "fixed" };
    const req = { user: { role: ROLES.GROWTH_MAKER } } as unknown as PayloadRequest;
    const originalDoc = { reviewStatus: "rejected", rejectionReason: "eksik görsel" };
    const result = manageReviewCycle({ data, operation: "update", originalDoc, req } as never);
    expect(result?.reviewStatus).toBe("pending");
    expect(result?.rejectionReason).toBeNull();
    expect(result?.rejectedAt).toBeNull();
    expect(result?.rejectedBy).toBeNull();
  });

  it("does not touch reviewStatus when the doc was not previously rejected", () => {
    const data: Record<string, unknown> = { title: "edit" };
    const req = { user: { role: ROLES.GROWTH_MAKER } } as unknown as PayloadRequest;
    const originalDoc = { reviewStatus: "pending" };
    const result = manageReviewCycle({ data, operation: "update", originalDoc, req } as never);
    expect(result).not.toHaveProperty("reviewStatus");
  });

  it("does not touch reviewStatus for a Checker's own reject action (same request sets it explicitly)", () => {
    const data: Record<string, unknown> = { reviewStatus: "rejected", rejectionReason: "x" };
    const req = { user: { role: ROLES.GROWTH_CHECKER } } as unknown as PayloadRequest;
    const originalDoc = { reviewStatus: "pending" };
    const result = manageReviewCycle({ data, operation: "update", originalDoc, req } as never);
    expect(result?.reviewStatus).toBe("rejected");
  });

  it("does nothing on create", () => {
    const data: Record<string, unknown> = { title: "new" };
    const req = { user: { role: ROLES.GROWTH_MAKER } } as unknown as PayloadRequest;
    const result = manageReviewCycle({ data, operation: "create", originalDoc: undefined, req } as never);
    expect(result).not.toHaveProperty("reviewStatus");
  });
});

describe("Campaigns auditRejection", () => {
  it("writes an audit entry the moment rejectionReason first appears", async () => {
    const create = vi.fn().mockResolvedValue({});
    const req = { payload: { create }, user: { id: 1, email: "a@b.com" }, i18n: { language: "tr" } } as unknown as PayloadRequest;
    const doc = { id: "c1", title: "Yaz Kampanyası", rejectionReason: "eksik görsel" };
    const previousDoc = { rejectionReason: null };

    await auditRejection({ req, doc, previousDoc, operation: "update" } as never);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "audit-logs",
        data: expect.objectContaining({ action: "rejected", documentId: "c1" }),
      })
    );
  });

  it("does not re-log when rejectionReason was already set before this save", async () => {
    const create = vi.fn().mockResolvedValue({});
    const req = { payload: { create }, user: { id: 1, email: "a@b.com" }, i18n: { language: "tr" } } as unknown as PayloadRequest;
    const doc = { id: "c1", title: "Yaz Kampanyası", rejectionReason: "eksik görsel" };
    const previousDoc = { rejectionReason: "eksik görsel" };

    await auditRejection({ req, doc, previousDoc, operation: "update" } as never);

    expect(create).not.toHaveBeenCalled();
  });

  it("does nothing on create", async () => {
    const create = vi.fn().mockResolvedValue({});
    const req = { payload: { create } } as unknown as PayloadRequest;
    const doc = { id: "c1", rejectionReason: "x" };

    await auditRejection({ req, doc, previousDoc: undefined, operation: "create" } as never);

    expect(create).not.toHaveBeenCalled();
  });
});
