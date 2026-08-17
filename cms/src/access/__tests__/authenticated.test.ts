import { afterEach, describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { authenticated, denyUnauthenticatedDraftRead, publishedOrAuthenticated } from "@/access/authenticated";

const reqWithUser = (hasUser: boolean, previewSecretHeader?: string | null) =>
  ({
    user: hasUser ? { id: 1, role: "x" } : undefined,
    t: (k: string) => k,
    headers: { get: (name: string) => (name === "x-preview-secret" ? (previewSecretHeader ?? null) : null) },
  }) as unknown as PayloadRequest;

describe("authenticated", () => {
  it("is true when a user is present", () => {
    expect(authenticated({ req: reqWithUser(true) })).toBe(true);
  });

  it("is false when no user is present", () => {
    expect(authenticated({ req: reqWithUser(false) })).toBe(false);
  });
});

describe("publishedOrAuthenticated", () => {
  const originalSecret = process.env.PREVIEW_SECRET;
  afterEach(() => {
    process.env.PREVIEW_SECRET = originalSecret;
    vi.unstubAllEnvs();
  });

  it("returns true (unrestricted) for a logged-in user", () => {
    expect(publishedOrAuthenticated({ req: reqWithUser(true) })).toBe(true);
  });

  it("returns a published-only Where constraint for anonymous requests", () => {
    expect(publishedOrAuthenticated({ req: reqWithUser(false) })).toEqual({
      _status: { equals: "published" },
    });
  });

  it("returns true for an anonymous request carrying the correct preview secret (the site's own draft-preview fetch)", () => {
    vi.stubEnv("PREVIEW_SECRET", "test-preview-secret");
    expect(publishedOrAuthenticated({ req: reqWithUser(false, "test-preview-secret") })).toBe(true);
  });

  it("still restricts to published when the preview secret is wrong", () => {
    vi.stubEnv("PREVIEW_SECRET", "test-preview-secret");
    expect(publishedOrAuthenticated({ req: reqWithUser(false, "wrong-secret") })).toEqual({
      _status: { equals: "published" },
    });
  });
});

describe("denyUnauthenticatedDraftRead", () => {
  it("throws when an anonymous request asks for draft=true on a read", () => {
    expect(() =>
      denyUnauthenticatedDraftRead({
        args: { draft: true },
        operation: "read",
        req: reqWithUser(false),
      } as never)
    ).toThrow();
  });

  it("allows an anonymous request without draft=true", () => {
    expect(() =>
      denyUnauthenticatedDraftRead({
        args: { draft: false },
        operation: "read",
        req: reqWithUser(false),
      } as never)
    ).not.toThrow();
  });

  it("allows an authenticated request with draft=true", () => {
    expect(() =>
      denyUnauthenticatedDraftRead({
        args: { draft: true },
        operation: "read",
        req: reqWithUser(true),
      } as never)
    ).not.toThrow();
  });

  it("ignores non-read operations even with draft=true", () => {
    expect(() =>
      denyUnauthenticatedDraftRead({
        args: { draft: true },
        operation: "update",
        req: reqWithUser(false),
      } as never)
    ).not.toThrow();
  });

  it("returns the original args unchanged when it does not throw", () => {
    const args = { draft: false, limit: 10 };
    const result = denyUnauthenticatedDraftRead({ args, operation: "read", req: reqWithUser(false) } as never);
    expect(result).toBe(args);
  });
});
