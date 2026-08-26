import { describe, expect, it, vi } from "vitest";
import type { CollectionBeforeChangeHook, Payload, PayloadRequest } from "payload";
import { Translations } from "@/collections/Translations";

const markCustomized = Translations.hooks!.beforeChange![0] as CollectionBeforeChangeHook;

describe("Translations markCustomized", () => {
  it("marks the row customized when an authenticated user saves it", () => {
    const data: Record<string, unknown> = { key: "x", tr: "a", en: "b" };
    const req = { user: { id: 1 } } as unknown as PayloadRequest;
    const result = markCustomized({ data, req } as never);
    expect(result?.isCustomized).toBe(true);
  });

  it("leaves the row untouched when the seeder writes it (no authenticated user)", () => {
    const data: Record<string, unknown> = { key: "x", tr: "a", en: "b" };
    const req = {} as unknown as PayloadRequest;
    const result = markCustomized({ data, req } as never);
    expect(result).not.toHaveProperty("isCustomized");
  });
});

describe("Translations afterChange/afterDelete", () => {
  it("refreshes the label cache after a change, using the live payload instance", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] });
    const payload = { find } as unknown as Payload;
    const req = { payload } as unknown as PayloadRequest;

    const afterChangeHook = Translations.hooks!.afterChange![0] as (args: { req: PayloadRequest }) => Promise<void>;
    await afterChangeHook({ req } as never);

    expect(find).toHaveBeenCalled();
  });

  it("refreshes the label cache after a delete too", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] });
    const payload = { find } as unknown as Payload;
    const req = { payload } as unknown as PayloadRequest;

    const afterDeleteHook = Translations.hooks!.afterDelete![0] as (args: { req: PayloadRequest }) => Promise<void>;
    await afterDeleteHook({ req } as never);

    expect(find).toHaveBeenCalled();
  });
});
