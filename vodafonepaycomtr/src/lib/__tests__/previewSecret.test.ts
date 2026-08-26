import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidPreviewSecret } from "@/lib/previewSecret";

describe("isValidPreviewSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the exact configured secret", () => {
    vi.stubEnv("PREVIEW_SECRET", "correct-horse-battery-staple");
    expect(isValidPreviewSecret("correct-horse-battery-staple")).toBe(true);
  });

  it("rejects a wrong secret of the same length", () => {
    vi.stubEnv("PREVIEW_SECRET", "correct-horse-battery-staple");
    expect(isValidPreviewSecret("correct-horse-battery-staplf")).toBe(false);
  });

  it("rejects a shorter or longer guess without crashing (timingSafeEqual requires equal length)", () => {
    vi.stubEnv("PREVIEW_SECRET", "correct-horse-battery-staple");
    expect(isValidPreviewSecret("short")).toBe(false);
    expect(isValidPreviewSecret("correct-horse-battery-staple-and-then-some")).toBe(false);
  });

  it("rejects when no secret was provided", () => {
    vi.stubEnv("PREVIEW_SECRET", "correct-horse-battery-staple");
    expect(isValidPreviewSecret(null)).toBe(false);
    expect(isValidPreviewSecret("")).toBe(false);
  });

  it("rejects everything when PREVIEW_SECRET is unset — an empty env value never grants access", () => {
    vi.stubEnv("PREVIEW_SECRET", "");
    expect(isValidPreviewSecret("")).toBe(false);
    expect(isValidPreviewSecret("anything")).toBe(false);
  });
});
