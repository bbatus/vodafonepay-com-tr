import { describe, expect, it } from "vitest";
import { TRANSLATION_DEFAULTS } from "@/lib/translationDefaults";

describe("TRANSLATION_DEFAULTS", () => {
  it("is non-empty and every entry has both a tr and an en value", () => {
    const entries = Object.entries(TRANSLATION_DEFAULTS);
    expect(entries.length).toBeGreaterThan(0);
    for (const [key, value] of entries) {
      expect(value.tr, `${key}.tr`).toBeTruthy();
      expect(value.en, `${key}.en`).toBeTruthy();
    }
  });

  it("keys follow the componentName.key namespacing convention", () => {
    for (const key of Object.keys(TRANSLATION_DEFAULTS)) {
      expect(key, key).toMatch(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+$/);
    }
  });
});
