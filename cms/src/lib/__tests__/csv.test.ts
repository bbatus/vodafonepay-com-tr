import { describe, expect, it } from "vitest";
import { buildCsv, csvEscape, formatDateTr, richTextToPlainText } from "@/lib/csv";

describe("csvEscape", () => {
  it("wraps the value in quotes", () => {
    expect(csvEscape("hello")).toBe('"hello"');
  });

  it("doubles embedded quotes rather than escaping with a backslash", () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });
});

describe("buildCsv", () => {
  it("joins the header and rows with semicolons and CRLF, matching Turkish-locale Excel's default list separator", () => {
    const csv = buildCsv(["Ad", "Soyad"], [["Ayşe", "Yılmaz"]]);
    expect(csv).toBe('"Ad";"Soyad"\r\n"Ayşe";"Yılmaz"');
  });

  it("returns just the escaped header when there are no rows", () => {
    expect(buildCsv(["Ad"], [])).toBe('"Ad"');
  });
});

describe("formatDateTr", () => {
  it("returns an empty string for null/undefined rather than 'Invalid Date'", () => {
    expect(formatDateTr(null)).toBe("");
    expect(formatDateTr(undefined)).toBe("");
  });

  it("formats a real ISO date without throwing", () => {
    expect(formatDateTr("2026-07-14T10:00:00.000Z")).not.toBe("");
  });
});

describe("richTextToPlainText (csv variant)", () => {
  const doc = (children: unknown[]) => ({ root: { children } });
  const text = (t: string) => ({ text: t });
  const paragraph = (children: unknown[]) => ({ children });

  it("returns an empty string for null/malformed input", () => {
    expect(richTextToPlainText(null)).toBe("");
    expect(richTextToPlainText({})).toBe("");
  });

  it("collapses multiple paragraphs onto one line, not multiple CSV rows", () => {
    expect(richTextToPlainText(doc([paragraph([text("Birinci")]), paragraph([text("İkinci")])]))).toBe(
      "Birinci İkinci"
    );
  });

  it("collapses internal whitespace/newlines to single spaces", () => {
    expect(richTextToPlainText(doc([paragraph([text("Çok   boşluklu\nmetin")])]))).toBe("Çok boşluklu metin");
  });
});
