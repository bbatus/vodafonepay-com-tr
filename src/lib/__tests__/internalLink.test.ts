import { describe, expect, it } from "vitest";
import { resolveInternalDocHref } from "@/lib/internalLink";

describe("resolveInternalDocHref", () => {
  it("resolves each of the three page-addressable collections", () => {
    expect(resolveInternalDocHref("blog-posts", { slug: "yeni-yazi" })).toBe("/blog/yeni-yazi");
    expect(resolveInternalDocHref("campaigns", { slug: "yaz-kampanyasi" })).toBe("/kampanyalar/yaz-kampanyasi");
    expect(resolveInternalDocHref("pages", { slug: "vodafone-pay-uygulama" })).toBe("/vodafone-pay-uygulama");
  });

  it("returns null for collections that don't map to a real page route — legal-pages and categories are deliberately excluded", () => {
    expect(resolveInternalDocHref("legal-pages", { slug: "cerez-politikasi" })).toBeNull();
    expect(resolveInternalDocHref("categories", { slug: "kart" })).toBeNull();
  });

  it("returns null rather than a broken link when the doc has no slug", () => {
    expect(resolveInternalDocHref("campaigns", { slug: null })).toBeNull();
    expect(resolveInternalDocHref("campaigns", {})).toBeNull();
    expect(resolveInternalDocHref("campaigns", null)).toBeNull();
    expect(resolveInternalDocHref("campaigns", undefined)).toBeNull();
  });
});
