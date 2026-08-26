import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { enable, redirectMock } = vi.hoisted(() => ({
  enable: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({ draftMode: vi.fn(async () => ({ enable, disable: vi.fn() })) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { GET } from "@/app/api/preview/route";

const req = (url: string) => ({ url } as NextRequest);

describe("GET /api/preview", () => {
  beforeEach(() => {
    vi.stubEnv("PREVIEW_SECRET", "the-real-secret");
    enable.mockClear();
    redirectMock.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ["a wrong secret", "http://localhost/api/preview?secret=wrong&path=/kampanyalar", 401],
    ["an absolute URL — an open-redirect attempt", "http://localhost/api/preview?secret=the-real-secret&path=https://evil.example.com", 400],
    ["a protocol-relative path (//evil.example.com) — also an open-redirect vector", "http://localhost/api/preview?secret=the-real-secret&path=//evil.example.com", 400],
  ])("rejects %s without ever enabling draft mode", async (_label, url, status) => {
    const res = await GET(req(url));
    expect(res.status).toBe(status);
    expect(enable).not.toHaveBeenCalled();
  });

  it("400s when path is missing entirely", async () => {
    const res = await GET(req("http://localhost/api/preview?secret=the-real-secret"));
    expect(res.status).toBe(400);
  });

  it("enables draft mode and redirects to the given same-site path on a valid request", async () => {
    await expect(GET(req("http://localhost/api/preview?secret=the-real-secret&path=/kampanyalar"))).rejects.toThrow(
      "NEXT_REDIRECT:/kampanyalar"
    );
    expect(enable).toHaveBeenCalledTimes(1);
  });
});
