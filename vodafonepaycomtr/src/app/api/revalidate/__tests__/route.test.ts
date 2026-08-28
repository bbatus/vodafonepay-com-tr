import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

const OLD_ENV = process.env;

function fakeRequest(opts: { secret?: string | null; body?: unknown }): NextRequest {
  return {
    headers: { get: (key: string) => (key === "x-revalidate-secret" ? (opts.secret ?? null) : null) },
    json: () => (opts.body === undefined ? Promise.reject(new Error("no body")) : Promise.resolve(opts.body)),
  } as unknown as NextRequest;
}

async function loadRoute() {
  vi.resetModules();
  return import("../route");
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV, REVALIDATE_SECRET: "test-secret-value" };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("rejects a missing secret", async () => {
    const { POST } = await loadRoute();
    const res = await POST(fakeRequest({ secret: null, body: { tag: "campaigns" } }));
    expect(res.status).toBe(401);
  });

  it("rejects a wrong secret", async () => {
    const { POST } = await loadRoute();
    const res = await POST(fakeRequest({ secret: "wrong", body: { tag: "campaigns" } }));
    expect(res.status).toBe(401);
  });

  it("rejects a secret of different length (still 401, no crash)", async () => {
    const { POST } = await loadRoute();
    const res = await POST(fakeRequest({ secret: "short", body: { tag: "campaigns" } }));
    expect(res.status).toBe(401);
  });

  it("rejects a missing tag", async () => {
    const { POST } = await loadRoute();
    const res = await POST(fakeRequest({ secret: "test-secret-value", body: {} }));
    expect(res.status).toBe(400);
  });

  it("rejects a tag not in the allowlist", async () => {
    const { POST } = await loadRoute();
    const res = await POST(fakeRequest({ secret: "test-secret-value", body: { tag: "not-a-real-tag" } }));
    expect(res.status).toBe(400);
  });

  it("accepts a valid secret and an allowlisted tag", async () => {
    const { POST } = await loadRoute();
    const res = await POST(fakeRequest({ secret: "test-secret-value", body: { tag: "campaigns" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ revalidated: true, tag: "campaigns" });
  });

  it("accepts every tag the CMS actually sends", async () => {
    const { POST } = await loadRoute();
    const tags = [
      "campaigns",
      "faq-items",
      "blog-posts",
      "fee-rows",
      "limit-tables",
      "nav-links",
      "announcements",
      "legal-pages",
      "contact-info",
      "content-blocks",
      "representatives",
      "cookie-rows",
      "page-meta",
      "pages",
    ];
    for (const tag of tags) {
      const res = await POST(fakeRequest({ secret: "test-secret-value", body: { tag } }));
      expect(res.status, `tag "${tag}" should be allowed`).toBe(200);
    }
  });

  it("accepts pathType 'layout' for path \"/\" and calls revalidatePath with the layout type", async () => {
    const { POST } = await loadRoute();
    const { revalidatePath } = await import("next/cache");
    const res = await POST(fakeRequest({ secret: "test-secret-value", body: { tag: "campaigns", paths: ["/"], pathType: "layout" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ revalidated: true, pathType: "layout" });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects pathType 'layout' for any path other than \"/\"", async () => {
    const { POST } = await loadRoute();
    const res = await POST(fakeRequest({ secret: "test-secret-value", body: { tag: "campaigns", paths: ["/kampanyalar"], pathType: "layout" } }));
    expect(res.status).toBe(400);
  });

  it("defaults to page-level revalidation when pathType is omitted", async () => {
    const { POST } = await loadRoute();
    const { revalidatePath } = await import("next/cache");
    const res = await POST(fakeRequest({ secret: "test-secret-value", body: { tag: "campaigns", paths: ["/kampanyalar"] } }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/kampanyalar", undefined);
  });

  it("rate-limits after too many requests in the window", async () => {
    const { POST } = await loadRoute();
    let lastStatus = 200;
    for (let i = 0; i < 35; i++) {
      const res = await POST(fakeRequest({ secret: "test-secret-value", body: { tag: "campaigns" } }));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
