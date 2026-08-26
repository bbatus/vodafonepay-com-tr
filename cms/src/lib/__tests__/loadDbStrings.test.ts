import { describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";
import { loadDbStrings } from "@/lib/loadDbStrings";
import { TRANSLATION_DEFAULTS } from "@/lib/translationDefaults";

const [sampleKey, sampleDefaults] = Object.entries(TRANSLATION_DEFAULTS)[0];

function fakePayload(rows: { key: string; tr: string; en: string }[]): Payload {
  return { find: vi.fn().mockResolvedValue({ docs: rows }) } as unknown as Payload;
}

describe("loadDbStrings", () => {
  it("prefers a DB-stored override over the hardcoded default", async () => {
    const t = await loadDbStrings(fakePayload([{ key: sampleKey, tr: "DB Türkçe", en: "DB English" }]), "tr");
    expect(t(sampleKey)).toBe("DB Türkçe");
  });

  it("falls back to TRANSLATION_DEFAULTS when the DB has no row for a key", async () => {
    const t = await loadDbStrings(fakePayload([]), "tr");
    expect(t(sampleKey)).toBe(sampleDefaults.tr);
  });

  it("falls back to the raw key when neither the DB nor the defaults have it", async () => {
    const t = await loadDbStrings(fakePayload([]), "tr");
    expect(t("no.such.key")).toBe("no.such.key");
  });

  it("falls back to the default when the DB row exists but this locale's column is empty", async () => {
    const t = await loadDbStrings(fakePayload([{ key: sampleKey, tr: "", en: "DB English" }]), "tr");
    expect(t(sampleKey)).toBe(sampleDefaults.tr);
  });

  it("reads the requested locale's column, not always tr", async () => {
    const t = await loadDbStrings(fakePayload([{ key: sampleKey, tr: "DB Türkçe", en: "DB English" }]), "en");
    expect(t(sampleKey)).toBe("DB English");
  });
});
