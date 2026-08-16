import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { assignNextOrder } from "@/hooks/ordering";

function fakeReq(highest?: number, reject = false) {
  const find = reject
    ? vi.fn().mockRejectedValue(new Error("db down"))
    : vi.fn().mockResolvedValue({ docs: highest === undefined ? [] : [{ order: highest }] });
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

  it("respects an explicitly typed position", async () => {
    const { req, find } = fakeReq(9);
    expect((await run(assignNextOrder("faq-items"), { order: 3 }, req)).order).toBe(3);
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
    const { req } = fakeReq(12);
    // This is what Payload hands the hook when `defaultValue: 1` is declared.
    expect((await run(assignNextOrder("faq-items", ["category"]), { category: "kampanyalar", order: 1 }, req)).order).toBe(1);
  });
});
