import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { categoryExistsValidate, generateSlug, pagesRead, preventSelfParent, setCreatedBy } from "@/collections/Pages";
import { CATEGORY_SCOPES } from "@/collections/Categories";

function fakeReq(existingSlugs: string[] = []): { req: PayloadRequest; count: ReturnType<typeof vi.fn> } {
  const count = vi.fn(async ({ where }: { where: { slug: { equals: string } } }) => ({
    totalDocs: existingSlugs.includes(where.slug.equals) ? 1 : 0,
  }));
  return { req: { payload: { count } } as unknown as PayloadRequest, count };
}

const reqWithUser = (hasUser: boolean, previewSecretHeader?: string | null) =>
  ({
    user: hasUser ? { id: 1, role: "x" } : undefined,
    headers: { get: (name: string) => (name === "x-preview-secret" ? (previewSecretHeader ?? null) : null) },
  }) as unknown as PayloadRequest;

type MutablePageData = { title: string; slug?: string; parent?: string | number };

describe("Pages generateSlug", () => {
  it("does nothing on update (slug never re-derives after create)", async () => {
    const { req } = fakeReq();
    const data: MutablePageData = { title: "Yeni Başlık" };
    const result = await generateSlug({ data, operation: "update", req } as never);
    expect(result.slug).toBeUndefined();
  });

  it("turkish-slugifies the title on create", async () => {
    const { req } = fakeReq();
    const data: MutablePageData = { title: "Hakkımızda & Vizyonumuz" };
    await generateSlug({ data, operation: "create", req } as never);
    expect(data.slug).toBe("hakkimizda-vizyonumuz");
  });

  it("appends a numeric suffix when the slug is already taken", async () => {
    const { req } = fakeReq(["hakkimizda"]);
    const data: MutablePageData = { title: "Hakkımızda" };
    await generateSlug({ data, operation: "create", req } as never);
    expect(data.slug).toBe("hakkimizda-2");
  });
});

describe("Pages setCreatedBy", () => {
  it("stamps createdBy on create", () => {
    const data: Record<string, unknown> = {};
    setCreatedBy({ data, operation: "create", req: { user: { id: 7 } } } as never);
    expect(data.createdBy).toBe(7);
  });

  it("never touches createdBy on update", () => {
    const data: Record<string, unknown> = {};
    setCreatedBy({ data, operation: "update", req: { user: { id: 7 } } } as never);
    expect(data.createdBy).toBeUndefined();
  });
});

describe("Pages preventSelfParent", () => {
  it("rejects a page being set as its own parent", () => {
    expect(() =>
      preventSelfParent({
        data: { parent: "42" },
        originalDoc: { id: "42" },
        req: { i18n: { language: "tr" } },
      } as never)
    ).toThrow(/kendi üst sayfası/);
  });

  it("allows a different page as parent", () => {
    const data = { parent: "5" };
    const result = preventSelfParent({ data, originalDoc: { id: "42" }, req: { i18n: { language: "tr" } } } as never);
    expect((result as typeof data).parent).toBe("5");
  });

  it("is a no-op when parent isn't being set (e.g. create, or unrelated update)", () => {
    const data = { title: "x" };
    expect(() => preventSelfParent({ data, originalDoc: undefined, req: {} } as never)).not.toThrow();
  });
});

describe("Pages pagesRead — Butterfly-parity visibility gate", () => {
  it("logged-in CMS users see everything regardless of visibility/status", () => {
    expect(pagesRead({ req: reqWithUser(true) } as never)).toBe(true);
  });

  it("the site's own preview-secret fetch sees everything", () => {
    process.env.PREVIEW_SECRET = "test-secret";
    expect(pagesRead({ req: reqWithUser(false, "test-secret") } as never)).toBe(true);
    delete process.env.PREVIEW_SECRET;
  });

  it("anonymous requests are constrained to published AND public", () => {
    expect(pagesRead({ req: reqWithUser(false) } as never)).toEqual({
      and: [{ _status: { equals: "published" } }, { visibility: { equals: "public" } }],
    });
  });
});

/**
 * Regression: a block's `category` accepted any string, so a typo saved fine
 * and the block then rendered NOTHING on the site with no explanation. Found
 * live on a page whose FAQ block had category "testtttt".
 */
describe("Pages categoryExistsValidate", () => {
  const reqWithCategories = (slugs: string[], language = "tr") =>
    ({
      i18n: { language },
      payload: {
        find: vi.fn(async () => ({ docs: slugs.map((slug) => ({ slug })), totalDocs: slugs.length })),
      },
    }) as unknown as PayloadRequest;

  const validate = categoryExistsValidate(CATEGORY_SCOPES.FAQ);

  it("accepts an empty value — empty means 'show everything', not an error", async () => {
    expect(await validate("", { req: reqWithCategories(["genel"]) })).toBe(true);
    expect(await validate(undefined, { req: reqWithCategories(["genel"]) })).toBe(true);
    expect(await validate("   ", { req: reqWithCategories(["genel"]) })).toBe(true);
  });

  it("accepts a slug that exists in the same flow", async () => {
    expect(await validate("genel", { req: reqWithCategories(["genel", "odeme"]) })).toBe(true);
  });

  it("rejects a slug that does not exist and names the ones that do", async () => {
    const result = await validate("testtttt", { req: reqWithCategories(["genel", "odeme"]) });
    expect(result).toContain("testtttt");
    expect(result).toContain("genel, odeme");
  });

  it("says to create a category first when the flow has none at all", async () => {
    const result = await validate("herhangi", { req: reqWithCategories([]) });
    expect(result).toContain("Kategoriler");
  });

  it("answers in English when the editor's admin language is English", async () => {
    const result = await validate("nope", { req: reqWithCategories(["genel"], "en") });
    expect(result).toContain("is not a category");
  });
});
