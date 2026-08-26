import { describe, expect, it } from "vitest";
import { HELP_CONTENT } from "@/lib/helpContent";

describe("HELP_CONTENT", () => {
  it("is non-empty and every entry has a tr and en title plus at least one step", () => {
    const entries = Object.entries(HELP_CONTENT);
    expect(entries.length).toBeGreaterThan(0);
    for (const [slug, entry] of entries) {
      expect(entry.tr.title, `${slug}.tr.title`).toBeTruthy();
      expect(entry.en.title, `${slug}.en.title`).toBeTruthy();
      expect(entry.tr.steps.length, `${slug}.tr.steps`).toBeGreaterThan(0);
      expect(entry.en.steps.length, `${slug}.en.steps`).toBeGreaterThan(0);
    }
  });
});
