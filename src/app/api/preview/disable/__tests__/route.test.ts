import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { disable, redirectMock } = vi.hoisted(() => ({
  disable: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({ draftMode: vi.fn(async () => ({ enable: vi.fn(), disable })) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { POST } from "@/app/api/preview/disable/route";

const req = (url: string) => ({ url } as NextRequest);

describe("POST /api/preview/disable", () => {
  beforeEach(() => {
    vi.stubEnv("PREVIEW_SECRET", "the-real-secret");
    disable.mockClear();
    redirectMock.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("401s on a wrong secret without ever disabling draft mode", async () => {
    const res = await POST(req("http://localhost/api/preview/disable?secret=wrong&path=/kampanyalar"));
    expect(res.status).toBe(401);
    expect(disable).not.toHaveBeenCalled();
  });

  it("disables draft mode and redirects to the given same-site path", async () => {
    await expect(
      POST(req("http://localhost/api/preview/disable?secret=the-real-secret&path=/kampanyalar"))
    ).rejects.toThrow("NEXT_REDIRECT:/kampanyalar");
    expect(disable).toHaveBeenCalledTimes(1);
  });

  it("falls back to / rather than open-redirecting on an absolute path", async () => {
    await expect(
      POST(req("http://localhost/api/preview/disable?secret=the-real-secret&path=https://evil.example.com"))
    ).rejects.toThrow("NEXT_REDIRECT:/");
    expect(disable).toHaveBeenCalledTimes(1);
  });

  it("falls back to / on a missing path", async () => {
    await expect(POST(req("http://localhost/api/preview/disable?secret=the-real-secret"))).rejects.toThrow(
      "NEXT_REDIRECT:/"
    );
  });
});
