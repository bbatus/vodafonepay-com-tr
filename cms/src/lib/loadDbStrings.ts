import type { Payload } from "payload";
import { TRANSLATION_DEFAULTS } from "@/lib/translationDefaults";

/** Server Component counterpart to `useDbStrings.ts` — same DB-override-with-fallback behavior, no client fetch needed. */
export async function loadDbStrings(payload: Payload, locale: "tr" | "en"): Promise<(key: string) => string> {
  const { docs } = await payload.find({
    collection: "translations",
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });
  const rows = docs as unknown as { key: string; tr: string; en: string }[];
  const map = new Map(rows.map((r) => [r.key, r]));
  return (key: string) => {
    const dbValue = map.get(key)?.[locale];
    if (dbValue) return dbValue;
    return TRANSLATION_DEFAULTS[key]?.[locale] ?? key;
  };
}
