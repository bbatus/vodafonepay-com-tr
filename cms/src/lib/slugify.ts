const TURKISH_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  İ: "i",
  Ç: "c",
  Ğ: "g",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

/**
 * E1: Turkish-aware slugify — plain `.toLowerCase()` leaves ç/ğ/ı/ö/ş/ü/İ
 * untouched (JS lowercases İ to i̇ with a combining dot, not a plain "i"),
 * which would produce slugs with stray non-ASCII characters. Transliterate
 * BEFORE lowercasing so "İ" maps to "i", not "i̇".
 */
export function turkishSlugify(input: string): string {
  const transliterated = input.replace(/[çğıöşüİÇĞÖŞÜ]/g, (ch) => TURKISH_MAP[ch] ?? ch);
  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Appends a numeric suffix (-2, -3, ...) until `slugExists` reports the
 * candidate is free. `slugExists` is injected so this stays a pure,
 * synchronously-testable function — Categories.ts passes in a payload.find
 * check, tests pass in an in-memory Set.
 */
export async function uniqueSlug(base: string, slugExists: (candidate: string) => Promise<boolean>): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (await slugExists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
