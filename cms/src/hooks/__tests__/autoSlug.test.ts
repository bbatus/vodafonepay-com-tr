import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { autoSlug } from "@/hooks/autoSlug";

function fakeReq(existingSlugs: string[] = []) {
  const count = vi.fn().mockImplementation(async ({ where }: { where: unknown }) => {
    const w = where as { slug?: { equals?: string }; and?: { slug?: { equals?: string } }[] };
    const candidate = w.slug?.equals ?? w.and?.[0]?.slug?.equals;
    return { totalDocs: existingSlugs.includes(candidate as string) ? 1 : 0 };
  });
  return { payload: { count } } as unknown as PayloadRequest;
}

const run = (hook: ReturnType<typeof autoSlug>, data: Record<string, unknown>, req: PayloadRequest, originalDoc?: Record<string, unknown>) =>
  hook({ data, req, originalDoc, operation: "create", collection: {} as never, context: {} } as never) as Promise<
    Record<string, unknown> | undefined
  >;

describe("autoSlug", () => {
  it("derives a slug from the source field when slug is unset", async () => {
    const hook = autoSlug("campaigns", "title");
    const result = await run(hook, { title: "Yaz Kampanyası" }, fakeReq());
    expect(result?.slug).toBe("yaz-kampanyasi");
  });

  it("never re-derives an already-set slug, even if the title changes — an already-shared URL must not move", async () => {
    const hook = autoSlug("campaigns", "title");
    const result = await run(hook, { title: "Yeni Başlık", slug: "eski-slug" }, fakeReq());
    expect(result?.slug).toBe("eski-slug");
  });

  it("carries the originalDoc's saved slug forward on a PATCH that omits the (readOnly) field", async () => {
    const hook = autoSlug("campaigns", "title");
    const result = await run(hook, { title: "Başlık" }, fakeReq(), { id: "1", slug: "korunan-slug" });
    expect(result?.slug).toBe("korunan-slug");
  });

  it("appends -2, -3 when the derived slug collides with another document", async () => {
    const hook = autoSlug("campaigns", "title");
    const result = await run(hook, { title: "Yaz Kampanyası" }, fakeReq(["yaz-kampanyasi", "yaz-kampanyasi-2"]));
    expect(result?.slug).toBe("yaz-kampanyasi-3");
  });

  it("excludes the document's own id from the collision check on update — otherwise a doc would collide with itself", async () => {
    const hook = autoSlug("campaigns", "title");
    const req = fakeReq();
    await run(hook, { title: "Başlık" }, req, { id: "5" });
    expect(req.payload.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { and: [{ slug: { equals: "baslik" } }, { id: { not_equals: "5" } }] } })
    );
  });

  it("leaves data untouched when there is no data object", async () => {
    const hook = autoSlug("campaigns", "title");
    const result = await hook({ data: undefined, req: fakeReq(), operation: "create", collection: {} as never, context: {} } as never);
    expect(result).toBeUndefined();
  });

  it("leaves slug unset when the source field is missing/blank and slugifies to nothing", async () => {
    const hook = autoSlug("campaigns", "title");
    const result = await run(hook, { title: "" }, fakeReq());
    expect(result?.slug).toBeUndefined();
  });

  it("leaves slug unset when the source field slugifies to an empty string (e.g. only punctuation)", async () => {
    const hook = autoSlug("campaigns", "title");
    const result = await run(hook, { title: "!!!" }, fakeReq());
    expect(result?.slug).toBeUndefined();
  });
});
