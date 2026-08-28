import { describe, expect, it, vi } from "vitest";
import type { CollectionBeforeChangeHook, PayloadRequest } from "payload";
import { FaqItems } from "@/collections/FaqItems";

const assignNextHomepageOrder = FaqItems.hooks!.beforeChange![2] as CollectionBeforeChangeHook;

function fakeReq(highest: number | undefined, findImpl?: () => Promise<never>) {
  const find = findImpl
    ? vi.fn(findImpl)
    : vi.fn().mockResolvedValue({ docs: highest === undefined ? [] : [{ homepageOrder: highest }] });
  return { payload: { find } } as unknown as PayloadRequest;
}

describe("FaqItems assignNextHomepageOrder", () => {
  it("does nothing when showOnHomepage is not set", async () => {
    const data: Record<string, unknown> = {};
    const result = await assignNextHomepageOrder({ data, req: fakeReq(undefined) } as never);
    expect(result).not.toHaveProperty("homepageOrder");
  });

  it("assigns 1 when this is the first homepage-flagged question", async () => {
    const data: Record<string, unknown> = { showOnHomepage: true };
    const result = await assignNextHomepageOrder({ data, req: fakeReq(undefined) } as never);
    expect(result?.homepageOrder).toBe(1);
  });

  it("assigns highest+1 when others already exist", async () => {
    const data: Record<string, unknown> = { showOnHomepage: true };
    const result = await assignNextHomepageOrder({ data, req: fakeReq(3) } as never);
    expect(result?.homepageOrder).toBe(4);
  });

  it("leaves an already-set positive homepageOrder untouched", async () => {
    const data: Record<string, unknown> = { showOnHomepage: true, homepageOrder: 5 };
    const req = fakeReq(3);
    const result = await assignNextHomepageOrder({ data, req } as never);
    expect(result?.homepageOrder).toBe(5);
    expect(req.payload.find).not.toHaveBeenCalled();
  });

  it("runs again on update when showOnHomepage is toggled on later, even without a pre-set order", async () => {
    const data: Record<string, unknown> = { showOnHomepage: true, homepageOrder: 0 };
    const result = await assignNextHomepageOrder({ data, req: fakeReq(2) } as never);
    expect(result?.homepageOrder).toBe(3);
  });

  it("falls back to 1 and logs when the lookup query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const data: Record<string, unknown> = { showOnHomepage: true };
    const req = fakeReq(undefined, () => Promise.reject(new Error("db down")));
    const result = await assignNextHomepageOrder({ data, req } as never);
    expect(result?.homepageOrder).toBe(1);
  });
});
