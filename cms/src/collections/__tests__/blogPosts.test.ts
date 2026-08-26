import { describe, expect, it, vi } from "vitest";
import type { CollectionBeforeValidateHook, PayloadRequest } from "payload";
import { BlogPosts } from "@/collections/BlogPosts";

const generateSlug = BlogPosts.hooks!.beforeValidate![0] as CollectionBeforeValidateHook;

function fakeReq(existingSlugs: string[] = []): PayloadRequest {
  const count = vi.fn(({ where }: { where: { slug: { equals: string } } }) => {
    const taken = existingSlugs.includes(where.slug.equals);
    return Promise.resolve({ totalDocs: taken ? 1 : 0 });
  });
  return { payload: { count } } as unknown as PayloadRequest;
}

describe("BlogPosts generateSlug", () => {
  it("derives a Turkish-safe slug from the title on create", async () => {
    const data: Record<string, unknown> = { title: "Yaz Kampanyası Başladı" };
    const result = await generateSlug({ data, operation: "create", req: fakeReq() } as never);
    expect(result?.slug).toBe("yaz-kampanyasi-basladi");
  });

  it("appends a numeric suffix when the slug is already taken", async () => {
    const data: Record<string, unknown> = { title: "Yaz Kampanyası" };
    const result = await generateSlug({
      data,
      operation: "create",
      req: fakeReq(["yaz-kampanyasi"]),
    } as never);
    expect(result?.slug).toBe("yaz-kampanyasi-2");
  });

  it("never runs on update — a published post's slug can't shift under a title edit", async () => {
    const data: Record<string, unknown> = { title: "Yeni Başlık" };
    const result = await generateSlug({ data, operation: "update", req: fakeReq() } as never);
    expect(result).not.toHaveProperty("slug");
  });

  it("does nothing when title is missing", async () => {
    const data: Record<string, unknown> = {};
    const result = await generateSlug({ data, operation: "create", req: fakeReq() } as never);
    expect(result).not.toHaveProperty("slug");
  });
});
