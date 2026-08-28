import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import {
  assignFooterOrder,
  assignNextFlaggedOrder,
  assignNextOrder,
  FOOTER_ORDER_MAX,
  orderField,
  rejectIfGroupFull,
} from "@/hooks/ordering";

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

  it(`rejects turning on one more item once all ${FOOTER_ORDER_MAX} slots are taken`, async () => {
    const taken = Array.from({ length: FOOTER_ORDER_MAX }, (_, i) => i + 1);
    const find = vi.fn().mockResolvedValue({
      docs: taken.map((footerOrder) => ({ footerOrder })),
      totalDocs: taken.length,
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

describe("orderField", () => {
  /**
   * The `order` field definition duplicated verbatim (comment included)
   * across 9 collection files, per a SonarQube CPD scan — extracted here
   * once. These tests lock the shape so a future edit to one caller doesn't
   * silently diverge from the rest.
   */
  it("declares a bare number field with no defaultValue", () => {
    const field = orderField();
    expect(field).toMatchObject({ name: "order", type: "number", min: 1 });
    expect(field).not.toHaveProperty("defaultValue");
  });

  it("omits the LiveOrderField widget when called with no arguments", () => {
    const field = orderField() as { admin?: { components?: unknown } };
    expect(field.admin?.components).toBeUndefined();
  });

  it("wires the LiveOrderField widget with the given collection/watchPath/mode", () => {
    const field = orderField({ collection: "step-cards", watchPath: "page", mode: "relationship" }) as {
      admin?: { components?: { Field?: { path?: string; clientProps?: Record<string, unknown> } } };
    };
    expect(field.admin?.components?.Field?.path).toBe("/components/LiveOrderField#default");
    expect(field.admin?.components?.Field?.clientProps).toEqual({
      collection: "step-cards",
      watchPath: "page",
      mode: "relationship",
    });
  });

  it("defaults mode to 'relationship' when omitted", () => {
    const field = orderField({ collection: "categories", watchPath: "scope" }) as {
      admin?: { components?: { Field?: { clientProps?: Record<string, unknown> } } };
    };
    expect(field.admin?.components?.Field?.clientProps?.mode).toBe("relationship");
  });

  it("wires flat mode (no watchPath needed) for ungrouped collections", () => {
    const field = orderField({ collection: "announcements", mode: "flat" }) as {
      admin?: { components?: { Field?: { path?: string; clientProps?: Record<string, unknown> } } };
    };
    expect(field.admin?.components?.Field?.path).toBe("/components/LiveOrderField#default");
    expect(field.admin?.components?.Field?.clientProps).toEqual({
      collection: "announcements",
      watchPath: undefined,
      mode: "flat",
    });
  });
});

describe("assignNextFlaggedOrder", () => {
  const hook = assignNextFlaggedOrder({
    collection: "pages",
    flagField: "showInProductsMenu",
    orderField: "productsMenuOrder",
  });

  const call = (data: Record<string, unknown>, req: PayloadRequest) =>
    hook({ data, operation: "create", req, collection: {} as never, context: {} } as never) as Promise<
      Record<string, unknown>
    >;

  it("leaves an unflagged document alone and never queries the DB for it", async () => {
    const find = vi.fn();
    const req = { payload: { find } } as unknown as PayloadRequest;

    const data = await call({ showInProductsMenu: false, title: "Gizli" }, req);

    expect(data.productsMenuOrder).toBeUndefined();
    expect(find).not.toHaveBeenCalled();
  });

  it("gives the first flagged document position 1", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });
    const req = { payload: { find } } as unknown as PayloadRequest;

    const data = await call({ showInProductsMenu: true }, req);

    expect(data.productsMenuOrder).toBe(1);
  });

  it("appends after the current highest position", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ productsMenuOrder: 4 }], totalDocs: 1 });
    const req = { payload: { find } } as unknown as PayloadRequest;

    const data = await call({ showInProductsMenu: true }, req);

    expect(data.productsMenuOrder).toBe(5);
    // Only siblings that are actually in the menu may influence the number.
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "pages",
        where: { showInProductsMenu: { equals: true } },
        sort: "-productsMenuOrder",
      })
    );
  });

  it("respects a position the editor typed themselves", async () => {
    const find = vi.fn();
    const req = { payload: { find } } as unknown as PayloadRequest;

    const data = await call({ showInProductsMenu: true, productsMenuOrder: 2 }, req);

    expect(data.productsMenuOrder).toBe(2);
    expect(find).not.toHaveBeenCalled();
  });

  it("still saves with position 1 when the lookup fails, rather than blocking the editor", async () => {
    const find = vi.fn().mockRejectedValue(new Error("db down"));
    const req = { payload: { find } } as unknown as PayloadRequest;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const data = await call({ showInProductsMenu: true }, req);

    expect(data.productsMenuOrder).toBe(1);
    error.mockRestore();
  });

  it("numbers a document flagged later on update, not only at creation time", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ productsMenuOrder: 2 }], totalDocs: 1 });
    const req = { payload: { find } } as unknown as PayloadRequest;

    const data = (await hook({
      data: { showInProductsMenu: true },
      operation: "update",
      req,
      collection: {} as never,
      context: {},
    } as never)) as Record<string, unknown>;

    expect(data.productsMenuOrder).toBe(3);
  });
});

describe("rejectIfGroupFull", () => {
  const hook = rejectIfGroupFull({
    collection: "nav-links",
    scopeField: "section",
    limits: { "footer-kurumsal": FOOTER_ORDER_MAX, "footer-yasal": FOOTER_ORDER_MAX },
  });

  const call = (
    data: Record<string, unknown>,
    req: PayloadRequest,
    operation: "create" | "update" = "create",
    originalDoc?: Record<string, unknown>
  ) => hook({ data, operation, req, originalDoc, collection: {} as never, context: {} } as never);

  it("ignores a section with no configured limit", async () => {
    const find = vi.fn();
    const req = { payload: { find } } as unknown as PayloadRequest;
    await call({ section: "header-main" }, req);
    expect(find).not.toHaveBeenCalled();
  });

  it("allows a new link when the footer section is under the limit", async () => {
    const find = vi.fn().mockResolvedValue({ totalDocs: FOOTER_ORDER_MAX - 1 });
    const req = { payload: { find } } as unknown as PayloadRequest;
    await expect(call({ section: "footer-kurumsal" }, req)).resolves.toBeDefined();
  });

  it(`rejects a new link once the footer section already has ${FOOTER_ORDER_MAX}`, async () => {
    const find = vi.fn().mockResolvedValue({ totalDocs: FOOTER_ORDER_MAX });
    const req = { payload: { find } } as unknown as PayloadRequest;
    await expect(call({ section: "footer-kurumsal" }, req)).rejects.toThrow(new RegExp(String(FOOTER_ORDER_MAX)));
  });

  it("resaving a link that stays in its own already-full section never counts itself", async () => {
    const find = vi.fn();
    const req = { payload: { find } } as unknown as PayloadRequest;
    await call(
      { section: "footer-yasal" },
      req,
      "update",
      { id: "self-id", section: "footer-yasal" }
    );
    expect(find).not.toHaveBeenCalled();
  });

  it("moving an existing link INTO a full footer section is still rejected, excluding itself from the count", async () => {
    const find = vi.fn().mockResolvedValue({ totalDocs: FOOTER_ORDER_MAX });
    const req = { payload: { find } } as unknown as PayloadRequest;
    await expect(
      call({ section: "footer-yasal" }, req, "update", { id: "self-id", section: "header-main" })
    ).rejects.toThrow(new RegExp(String(FOOTER_ORDER_MAX)));
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { and: expect.arrayContaining([{ id: { not_equals: "self-id" } }]) } })
    );
  });
});
