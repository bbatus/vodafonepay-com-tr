import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import { Documents } from "@/collections/Documents";
import { Representatives } from "@/collections/Representatives";
import { PageMeta } from "@/collections/PageMeta";
import { CookieRows } from "@/collections/CookieRows";
import { ROLES } from "@/access/roles";

describe("Documents", () => {
  it("is publicly readable (RFP: contracts/forms must be downloadable by visitors)", () => {
    expect(Documents.access?.read?.({} as never)).toBe(true);
  });

  it("is hidden from the admin sidebar (unified into LegalPages' own drawer)", () => {
    expect(Documents.admin?.hidden).toBe(true);
  });

  it("accepts PDF and common audio mimetypes only", () => {
    expect(Documents.upload).not.toBe(false);
    if (Documents.upload && typeof Documents.upload === "object") {
      expect(Documents.upload.mimeTypes).toContain("application/pdf");
      expect(Documents.upload.mimeTypes).toContain("audio/mpeg");
    }
  });

  it("only a New Vertical Maker can delete", () => {
    const maker = { user: { role: ROLES.NEW_VERTICAL_MAKER } } as unknown as PayloadRequest;
    const checker = { user: { role: ROLES.NEW_VERTICAL_CHECKER } } as unknown as PayloadRequest;
    expect(Documents.access?.delete?.({ req: maker } as never)).toBe(true);
    expect(Documents.access?.delete?.({ req: checker } as never)).toBe(false);
  });
});

describe("Representatives", () => {
  it("is publicly readable (powers /temsilciliklerimiz search + /temsilci/[id])", () => {
    expect(Representatives.access?.read?.({} as never)).toBe(true);
  });

  it("requires businessName, address, province, district", () => {
    const names = Representatives.fields.map((f) => ("name" in f ? f.name : undefined));
    expect(names).toEqual(expect.arrayContaining(["businessName", "address", "province", "district"]));
  });
});

describe("PageMeta", () => {
  it("read follows publishedOrAuthenticated — anonymous only sees published rows", () => {
    const read = PageMeta.access!.read!;
    const anonymous = { headers: { get: () => null } } as unknown as PayloadRequest;
    const authed = { user: { id: 1 }, headers: { get: () => null } } as unknown as PayloadRequest;
    expect(read({ req: authed } as never)).toBe(true);
    expect(read({ req: anonymous } as never)).toEqual({ _status: { equals: "published" } });
  });

  it("blocks an unauthenticated ?draft=true request via denyUnauthenticatedDraftRead", () => {
    const hook = PageMeta.hooks!.beforeOperation![0];
    const anonymous = {} as unknown as PayloadRequest;
    expect(() => hook({ args: { draft: true }, operation: "read", req: anonymous } as never)).toThrow();
  });

  it("pageKey is required and unique", () => {
    const pageKeyField = PageMeta.fields.find((f) => "name" in f && f.name === "pageKey");
    expect(pageKeyField).toMatchObject({ required: true, unique: true });
  });
});

describe("CookieRows", () => {
  it("read follows publishedOrAuthenticated, same as PageMeta", () => {
    const read = CookieRows.access!.read!;
    const anonymous = { headers: { get: () => null } } as unknown as PayloadRequest;
    expect(read({ req: anonymous } as never)).toEqual({ _status: { equals: "published" } });
  });

  it("party and category are constrained selects with the site's real cookie-table values", () => {
    const party = CookieRows.fields.find((f) => "name" in f && f.name === "party");
    const category = CookieRows.fields.find((f) => "name" in f && f.name === "category");
    expect(party).toBeDefined();
    expect(category).toBeDefined();
    if (party && "options" in party) {
      const values = party.options?.map((o) => (typeof o === "string" ? o : o.value));
      expect(values).toEqual(["Birinci taraf", "Üçüncü taraf"]);
    }
    if (category && "options" in category) {
      expect(category.options).toHaveLength(4);
    }
  });
});
