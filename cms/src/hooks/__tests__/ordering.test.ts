import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { assignFooterOrder, assignNextOrder, FOOTER_ORDER_MAX } from "@/hooks/ordering";

function fakeReq(highest?: number, reject = false) {
  // Same canned response for every find() call (the "highest order" lookup
  // AND, since the RFP follow-up, the duplicate-order check) — totalDocs: 0
  // is what tells rejectIfOrderTaken there's no collision, matching the
  // "empty collection" (highest === undefined) shape these tests already used.
  const find = reject
    ? vi.fn().mockRejectedValue(new Error("db down"))
    : vi.fn().mockResolvedValue({
        docs: highest === undefined ? [] : [{ order: highest }],
        totalDocs: highest === undefined ? 0 : 1,
      });
  return { req: { payload: { find } } as unknown as PayloadRequest, find };
}

/** A find() mock for rejectIfOrderTaken specifically: no sibling has `order`. */
function fakeReqNoCollision() {
  const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });
  return { req: { payload: { find } } as unknown as PayloadRequest, find };
}

const run = async (
  hook: ReturnType<typeof assignNextOrder>,
  data: Record<string, unknown>,
  req: PayloadRequest,
  operation: "create" | "update" = "create"
) => hook({ data, operation, req, collection: {} as never, context: {} } as never) as Promise<Record<string, unknown>>;

describe("assignNextOrder", () => {
  it("puts a new record at the end of its list, 1-based", async () => {
    const { req } = fakeReq(4);
    expect((await run(assignNextOrder("faq-items"), {}, req)).order).toBe(5);
  });

  it("starts at 1 when the collection is empty", async () => {
    const { req } = fakeReq(undefined);
    expect((await run(assignNextOrder("faq-items"), {}, req)).order).toBe(1);
  });

  it("scopes the numbering to siblings in the same group", async () => {
    const { req, find } = fakeReq(2);
    await run(assignNextOrder("feature-cards", ["page"]), { page: "aninda-bakiye" }, req);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { and: [{ page: { equals: "aninda-bakiye" } }] } })
    );
  });

  it("respects an explicitly typed position when nothing else in the group has it", async () => {
    const { req, find } = fakeReqNoCollision();
    expect((await run(assignNextOrder("faq-items"), { order: 3 }, req)).order).toBe(3);
    // Still queried once — RFP follow-up: an explicit value now gets checked
    // for a collision with a sibling before being accepted.
    expect(find).toHaveBeenCalledTimes(1);
  });

  it("rejects an explicitly typed position a sibling in the same group already has", async () => {
    const { req } = fakeReq(3); // a sibling already sits at order 3
    await expect(run(assignNextOrder("faq-items"), { order: 3 }, req)).rejects.toThrow(/3/);
  });

  it("on update, rejects moving into a position a DIFFERENT sibling already occupies", async () => {
    const { req, find } = fakeReq(5);
    const hook = assignNextOrder("faq-items", ["category"]);
    await expect(
      hook({
        data: { order: 5, category: "kart" },
        operation: "update",
        req,
        originalDoc: { id: "self-id", order: 2 },
        collection: {} as never,
        context: {},
      } as never)
    ).rejects.toThrow(/5/);
    // Excludes the document being edited from the collision check.
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { and: expect.arrayContaining([{ id: { not_equals: "self-id" } }]) } })
    );
  });

  it("on update, allows resaving a document at its own unchanged position", async () => {
    const { req, find } = fakeReqNoCollision();
    const hook = assignNextOrder("faq-items");
    const result = (await hook({
      data: { order: 4 },
      operation: "update",
      req,
      originalDoc: { id: "self-id", order: 4 },
      collection: {} as never,
      context: {},
    } as never)) as Record<string, unknown>;
    expect(result.order).toBe(4);
    expect(find).not.toHaveBeenCalled();
  });

  it("treats 0 as unset — it's the value the old defaultValue produced, never a valid 1-based position", async () => {
    const { req } = fakeReq(6);
    expect((await run(assignNextOrder("faq-items"), { order: 0 }, req)).order).toBe(7);
  });

  it("leaves updates alone", async () => {
    const { req, find } = fakeReq(6);
    expect((await run(assignNextOrder("faq-items"), {}, req, "update")).order).toBeUndefined();
    expect(find).not.toHaveBeenCalled();
  });

  it("never blocks the save when the lookup fails", async () => {
    const { req } = fakeReq(undefined, true);
    expect((await run(assignNextOrder("faq-items"), {}, req)).order).toBe(1);
  });
});

describe("the order field must not declare a defaultValue", () => {
  /**
   * Payload fills field defaults BEFORE beforeChange runs, so a
   * `defaultValue: 1` on `order` reaches assignNextOrder looking identical to
   * a number the editor typed — the "respect an explicit value" guard bails
   * out and auto-numbering silently never happens.
   *
   * Caught live: a new FAQ created in a category whose highest order was 12
   * was still saved as 1. This test fails if anyone reintroduces the default.
   */
  it("assigns max+1 when order arrives unset, the way an empty form field does", async () => {
    const { req } = fakeReq(12);
    expect((await run(assignNextOrder("faq-items", ["category"]), { category: "kampanyalar" }, req)).order).toBe(13);
  });

  it("would be defeated by a defaultValue — proving why the field has none", async () => {
    const { req } = fakeReqNoCollision();
    // This is what Payload hands the hook when `defaultValue: 1` is declared.
    expect((await run(assignNextOrder("faq-items", ["category"]), { category: "kampanyalar", order: 1 }, req)).order).toBe(1);
  });
});

describe("assignFooterOrder", () => {
  const runFooter = async (data: Record<string, unknown>, req: PayloadRequest, extra: Record<string, unknown> = {}) =>
    assignFooterOrder("campaigns")({ data, operation: "create", req, collection: {} as never, context: {}, ...extra } as never) as Promise<
      Record<string, unknown>
    >;

  it("is a no-op when showInFooter isn't part of this save", async () => {
    const { req } = fakeReqNoCollision();
    const result = await runFooter({ title: "x" }, req);
    expect(result.footerOrder).toBeUndefined();
  });

  it("clears footerOrder when showInFooter is explicitly turned off", async () => {
    const { req } = fakeReqNoCollision();
    const result = await runFooter({ showInFooter: false, footerOrder: 3 }, req);
    expect(result.footerOrder).toBeNull();
  });

  it("assigns slot 1 when nothing else is shown in the footer", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });
    const req = { payload: { find } } as unknown as PayloadRequest;
    const result = await runFooter({ showInFooter: true }, req);
    expect(result.footerOrder).toBe(1);
  });

  it("fills the first open GAP, not just highest+1 — slots 1,2,4,5,6 taken means 3 is next", async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [{ footerOrder: 1 }, { footerOrder: 2 }, { footerOrder: 4 }, { footerOrder: 5 }, { footerOrder: 6 }],
      totalDocs: 5,
    });
    const req = { payload: { find } } as unknown as PayloadRequest;
    const result = await runFooter({ showInFooter: true }, req);
    expect(result.footerOrder).toBe(3);
  });

  it(`rejects turning a 7th item on once all ${FOOTER_ORDER_MAX} slots are taken`, async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [1, 2, 3, 4, 5, 6].map((footerOrder) => ({ footerOrder })),
      totalDocs: 6,
    });
    const req = { payload: { find } } as unknown as PayloadRequest;
    await expect(runFooter({ showInFooter: true }, req)).rejects.toThrow(new RegExp(String(FOOTER_ORDER_MAX)));
  });

  it("respects an explicit footerOrder when the slot is free", async () => {
    const { req } = fakeReqNoCollision();
    const result = await runFooter({ showInFooter: true, footerOrder: 4 }, req);
    expect(result.footerOrder).toBe(4);
  });

  it("rejects an explicit footerOrder a sibling already occupies", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ id: "other", title: "Diğer Kampanya" }], totalDocs: 1 });
    const req = { payload: { find } } as unknown as PayloadRequest;
    await expect(runFooter({ showInFooter: true, footerOrder: 2 }, req)).rejects.toThrow(/Diğer Kampanya/);
  });

  it("on update, excludes the document being edited from the collision check", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });
    const req = { payload: { find } } as unknown as PayloadRequest;
    await assignFooterOrder("campaigns")({
      data: { showInFooter: true, footerOrder: 2 },
      operation: "update",
      req,
      originalDoc: { id: "self-id", showInFooter: true, footerOrder: 2 },
      collection: {} as never,
      context: {},
    } as never);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { and: expect.arrayContaining([{ id: { not_equals: "self-id" } }]) } })
    );
  });
});
