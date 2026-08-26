import { describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { getBlogPosts, getCampaigns, getPages, getRepresentatives } from "@/lib/cms";

vi.mock("@/lib/cms", () => ({
  getCampaigns: vi.fn(),
  getBlogPosts: vi.fn(),
  getRepresentatives: vi.fn(),
  getPages: vi.fn(),
}));

function mockAll(overrides: Partial<{ campaigns: unknown; blogPosts: unknown; representatives: unknown; pages: unknown }>) {
  vi.mocked(getCampaigns).mockResolvedValue((overrides.campaigns ?? null) as never);
  vi.mocked(getBlogPosts).mockResolvedValue((overrides.blogPosts ?? null) as never);
  vi.mocked(getRepresentatives).mockResolvedValue((overrides.representatives ?? null) as never);
  vi.mocked(getPages).mockResolvedValue((overrides.pages ?? null) as never);
}

describe("sitemap", () => {
  it("includes every hand-built static route", async () => {
    mockAll({});
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "http://localhost:3000/blog")).toBe(true);
    expect(entries.some((e) => e.url === "http://localhost:3000")).toBe(true);
  });

  it("adds one entry per published campaign that has a slug", async () => {
    mockAll({ campaigns: [{ id: "1", slug: "yaz-kampanyasi" }, { id: "2", slug: null }] });
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "http://localhost:3000/kampanyalar/yaz-kampanyasi")).toBe(true);
    // The slug-less campaign must not produce a broken /kampanyalar/undefined entry.
    expect(entries.every((e) => !e.url.includes("undefined"))).toBe(true);
  });

  it("adds one entry per blog post, campaign-detail-like", async () => {
    mockAll({ blogPosts: [{ id: "1", slug: "yeni-yazi" }] });
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "http://localhost:3000/blog/yeni-yazi")).toBe(true);
  });

  it("adds one entry per representative, keyed by id not slug", async () => {
    mockAll({ representatives: [{ id: "42" }] });
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "http://localhost:3000/temsilci/42")).toBe(true);
  });

  it("adds one entry per editor-built Pages document", async () => {
    mockAll({ pages: [{ id: "1", slug: "vodafone-pay-uygulama" }] });
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "http://localhost:3000/vodafone-pay-uygulama")).toBe(true);
  });

  it("degrades to only the static routes when every CMS fetch returns null", async () => {
    mockAll({});
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => !e.url.includes("undefined") && !e.url.includes("null"))).toBe(true);
  });
});
