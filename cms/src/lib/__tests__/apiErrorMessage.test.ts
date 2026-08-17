import { describe, expect, it } from "vitest";
import { describeApiError } from "@/lib/apiErrorMessage";

describe("describeApiError", () => {
  it("prefers the server's own message when the body carries one", () => {
    const message = describeApiError({
      status: 409,
      body: { message: "\"Yaz Kampanyası\" silinemedi — 2 kayıt hâlâ buna bağlı" },
      locale: "tr",
      context: "campaign",
    });
    expect(message).toBe("\"Yaz Kampanyası\" silinemedi — 2 kayıt hâlâ buna bağlı");
  });

  it("falls back to errors[0].message when there's no top-level message", () => {
    const message = describeApiError({
      status: 400,
      body: { errors: [{ message: "Slug zaten kullanılıyor." }] },
      locale: "tr",
      context: "blog",
    });
    expect(message).toBe("Slug zaten kullanılıyor.");
  });

  it("maps known status codes to a human TR message when the body has nothing usable", () => {
    expect(describeApiError({ status: 403, locale: "tr", context: "campaign" })).toBe("Bu işlem için yetkiniz yok.");
    expect(describeApiError({ status: 423, locale: "tr", context: "login" })).toContain("kilitlendi");
  });

  it("maps the same status codes in English", () => {
    expect(describeApiError({ status: 403, locale: "en", context: "campaign" })).toBe("You don't have permission to do this.");
  });

  it("recognizes a network failure (fetch TypeError) distinct from a server error", () => {
    const err = new TypeError("Failed to fetch");
    const message = describeApiError({ err, locale: "tr", context: "faq" });
    expect(message).toContain("bağlanılamadı");
  });

  it("falls back to a context-labeled generic message for unknown failures", () => {
    expect(describeApiError({ locale: "tr", context: "generic" })).toBe("İşlem tamamlanamadı. Tekrar deneyin.");
    expect(describeApiError({ locale: "tr", context: "campaign" })).toBe("Kampanya işlemi tamamlanamadı. Tekrar deneyin.");
  });
});
