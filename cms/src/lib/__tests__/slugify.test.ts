import { describe, expect, it } from "vitest";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";

describe("turkishSlugify", () => {
  it("transliterates Turkish characters", () => {
    expect(turkishSlugify("Çeşme İndirimleri")).toBe("cesme-indirimleri");
    expect(turkishSlugify("Ödeme Şartları Öğrenci")).toBe("odeme-sartlari-ogrenci");
    expect(turkishSlugify("ĞÜŞ")).toBe("gus");
  });

  it("lowercases and hyphenates spaces", () => {
    expect(turkishSlugify("Kart Kampanyaları")).toBe("kart-kampanyalari");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(turkishSlugify("  Yaz -- Kampanyası!!  ")).toBe("yaz-kampanyasi");
  });

  it("strips characters with no ASCII equivalent", () => {
    expect(turkishSlugify("50% İndirim & Kazan")).toBe("50-indirim-kazan");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it's free", async () => {
    const result = await uniqueSlug("kart", async () => false);
    expect(result).toBe("kart");
  });

  it("appends -2 on the first collision", async () => {
    const taken = new Set(["kart"]);
    const result = await uniqueSlug("kart", async (candidate) => taken.has(candidate));
    expect(result).toBe("kart-2");
  });

  it("keeps incrementing past multiple collisions", async () => {
    const taken = new Set(["kart", "kart-2", "kart-3"]);
    const result = await uniqueSlug("kart", async (candidate) => taken.has(candidate));
    expect(result).toBe("kart-4");
  });
});
