import { describe, expect, it } from "vitest";
import { LegalPages } from "@/collections/LegalPages";

/**
 * `fillDocumentSlugs` is what gives every "Sözleşmeler ve Formlar" row its
 * public URL (`/sozlesmeler-ve-formlar/{slug}`), so these lock the behaviour in
 * place: a wrong slug here silently moves or breaks a live legal-document page.
 * The hook is not exported, so it is reached the way Payload reaches it.
 */
const hook = LegalPages.hooks!.beforeValidate![0] as (args: {
  data: Record<string, unknown>;
}) => Record<string, unknown>;

const run = (groups: unknown) => hook({ data: { groups } });

describe("LegalPages fillDocumentSlugs", () => {
  it("derives a slug from prefix + label", () => {
    const data = run([{ documents: [{ source: "page", prefix: "Tüketici Hakları", label: "Tıklayınız" }] }]);
    const doc = (data.groups as { documents: { slug?: string }[] }[])[0].documents[0];

    expect(doc.slug).toBe("tuketici-haklari-tiklayiniz");
  });

  it("falls back to the label alone when there is no prefix", () => {
    const data = run([{ documents: [{ source: "page", label: "Üyelik Sözleşmesi" }] }]);

    expect((data.groups as { documents: { slug?: string }[] }[])[0].documents[0].slug).toBe("uyelik-sozlesmesi");
  });

  it("never re-derives a slug that already exists — the page may already be linked to", () => {
    const data = run([{ documents: [{ source: "page", label: "Yeni Başlık", slug: "eski-adres" }] }]);

    expect((data.groups as { documents: { slug?: string }[] }[])[0].documents[0].slug).toBe("eski-adres");
  });

  it("de-duplicates identical labels with -2, -3 across DIFFERENT groups", () => {
    const data = run([
      { documents: [{ source: "page", label: "Tıklayınız" }] },
      { documents: [{ source: "page", label: "Tıklayınız" }, { source: "page", label: "Tıklayınız" }] },
    ]);
    const groups = data.groups as { documents: { slug?: string }[] }[];

    expect([
      groups[0].documents[0].slug,
      groups[1].documents[0].slug,
      groups[1].documents[1].slug,
    ]).toEqual(["tiklayiniz", "tiklayiniz-2", "tiklayiniz-3"]);
  });

  it("does not collide with a slug an editor already saved on another row", () => {
    const data = run([
      { documents: [{ source: "page", label: "Bir Şey", slug: "tiklayiniz" }, { source: "page", label: "Tıklayınız" }] },
    ]);
    const docs = (data.groups as { documents: { slug?: string }[] }[])[0].documents;

    expect(docs[1].slug).toBe("tiklayiniz-2");
  });

  it("leaves non-page rows alone — a PDF link has no page URL to name", () => {
    const data = run([{ documents: [{ source: "pdf", label: "Tıklayınız" }] }]);

    expect((data.groups as { documents: { slug?: string }[] }[])[0].documents[0].slug).toBeUndefined();
  });

  it("skips a row whose label slugifies to nothing rather than inventing an empty URL", () => {
    const data = run([{ documents: [{ source: "page", label: "!!!" }] }]);

    expect((data.groups as { documents: { slug?: string }[] }[])[0].documents[0].slug).toBeUndefined();
  });

  it("tolerates a missing/empty groups array", () => {
    expect(() => run(undefined)).not.toThrow();
    expect(() => run([{}])).not.toThrow();
  });
});
