import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { CATEGORY_SCOPES, generateSlug } from "@/collections/Categories";

/**
 * The bug this guards against: slug uniqueness was checked globally, so a
 * FAQ-scope "Anında Bakiye" collided with the campaign-scope one of the same
 * name and got forced into "aninda-bakiye-2" even though the two are never
 * queried together (verified live against vodafonepay.com.tr — the two
 * scopes are genuinely separate taxonomies that happen to share some names).
 */
function fakeReq(existingSlugsByScope: Record<string, string[]>): { req: PayloadRequest; count: ReturnType<typeof vi.fn> } {
  const count = vi.fn(async ({ where }: { where: { and: [{ slug: { equals: string } }, { scope: { equals: string } }] } }) => {
    const [{ slug }, { scope }] = where.and;
    const taken = existingSlugsByScope[scope.equals]?.includes(slug.equals) ?? false;
    return { totalDocs: taken ? 1 : 0 };
  });
  return { req: { payload: { count } } as unknown as PayloadRequest, count };
}

type MutableCategoryData = { label: string; scope: string; slug?: string };

describe("Categories generateSlug", () => {
  it("does nothing on update (slug never re-derives after create)", async () => {
    const { req } = fakeReq({});
    const data: MutableCategoryData = { label: "Renamed", scope: CATEGORY_SCOPES.CAMPAIGN };
    const result = await generateSlug({ data, operation: "update", req } as never);
    expect(result.slug).toBeUndefined();
  });

  it("the same label produces the same slug in two different scopes, no suffix", async () => {
    const { req } = fakeReq({}); // nothing taken in either scope yet
    const campaignData: MutableCategoryData = { label: "Anında Bakiye", scope: CATEGORY_SCOPES.CAMPAIGN };
    await generateSlug({ data: campaignData, operation: "create", req } as never);
    expect(campaignData.slug).toBe("aninda-bakiye");

    const faqData: MutableCategoryData = { label: "Anında Bakiye", scope: CATEGORY_SCOPES.FAQ };
    await generateSlug({ data: faqData, operation: "create", req } as never);
    expect(faqData.slug).toBe("aninda-bakiye");
  });

  it("a real collision WITHIN the same scope still gets a numeric suffix", async () => {
    const { req } = fakeReq({ [CATEGORY_SCOPES.CAMPAIGN]: ["kart"] });
    const data: MutableCategoryData = { label: "Kart", scope: CATEGORY_SCOPES.CAMPAIGN };
    await generateSlug({ data, operation: "create", req } as never);
    expect(data.slug).toBe("kart-2");
  });

  it("checks uniqueness scoped to the document's own scope, not globally", async () => {
    const { req, count } = fakeReq({ [CATEGORY_SCOPES.CAMPAIGN]: ["genel"] });
    const data: MutableCategoryData = { label: "Genel", scope: CATEGORY_SCOPES.FAQ };
    await generateSlug({ data, operation: "create", req } as never);
    expect(data.slug).toBe("genel"); // FAQ scope has no "genel" yet, campaign's doesn't count
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { and: [{ slug: { equals: "genel" } }, { scope: { equals: CATEGORY_SCOPES.FAQ } }] },
      })
    );
  });
});
