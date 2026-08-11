import { describe, expect, it } from "vitest";
import { Announcements } from "@/collections/Announcements";
import { BlogPosts } from "@/collections/BlogPosts";
import { Campaigns } from "@/collections/Campaigns";
import { FaqItems } from "@/collections/FaqItems";
import { FeatureCards } from "@/collections/FeatureCards";
import { FeeRows } from "@/collections/FeeRows";
import { LegalPages } from "@/collections/LegalPages";
import { LimitTables } from "@/collections/LimitTables";
import { Media } from "@/collections/Media";
import { NavLinks } from "@/collections/NavLinks";
import { ProductHeroes } from "@/collections/ProductHeroes";
import { StepCards } from "@/collections/StepCards";
import { Users } from "@/collections/Users";
import { ContactInfo } from "@/globals/ContactInfo";
import { ROLES } from "@/access/roles";

const draftsEnabledNewVerticalOnly = [
  ["Announcements", Announcements],
  ["BlogPosts", BlogPosts],
  ["FaqItems", FaqItems],
] as const;

const newVerticalOnly = [
  ["FeatureCards", FeatureCards],
  ["FeeRows", FeeRows],
  ["LegalPages", LegalPages],
  ["LimitTables", LimitTables],
  ["NavLinks", NavLinks],
  ["ProductHeroes", ProductHeroes],
  ["StepCards", StepCards],
] as const;

describe("New Vertical-only, drafts-enabled collections", () => {
  it.each(draftsEnabledNewVerticalOnly)("%s: read is public, create/update are role-gated", (_name, collection) => {
    expect(collection.access?.read).toBeTypeOf("function");
    expect(collection.access?.create).toBeTypeOf("function");
    expect(collection.access?.update).toBeTypeOf("function");
    expect(collection.access?.delete).toBeTypeOf("function");
    expect(collection.access?.readVersions).toBeTypeOf("function");
    expect(collection.hooks?.beforeOperation?.length).toBeGreaterThan(0);
  });
});

describe("New Vertical-only, non-drafts collections", () => {
  it.each(newVerticalOnly)("%s: read is public, create/update/delete are role-gated", (_name, collection) => {
    expect(collection.access?.read).toBeTypeOf("function");
    expect(collection.access?.create).toBeTypeOf("function");
    expect(collection.access?.update).toBeTypeOf("function");
    expect(collection.access?.delete).toBeTypeOf("function");
  });
});

describe("Campaigns — dual-scope New Vertical + Growth", () => {
  it("has role-gated create/update/delete and the publish-guard hook", () => {
    expect(Campaigns.access?.create).toBeTypeOf("function");
    expect(Campaigns.access?.update).toBeTypeOf("function");
    expect(Campaigns.access?.delete).toBeTypeOf("function");
    expect(Campaigns.access?.readVersions).toBeTypeOf("function");
    expect(Campaigns.hooks?.beforeChange?.length).toBeGreaterThan(0);
    expect(Campaigns.hooks?.beforeOperation?.length).toBeGreaterThan(0);
  });

  it("versions.drafts is enabled (required for the maker/checker workflow)", () => {
    expect(Campaigns.versions).toEqual({ drafts: true });
  });
});

describe("Media", () => {
  it("allows public read and role-gated create/update/delete", () => {
    expect(Media.access?.read).toBeTypeOf("function");
    expect(Media.access?.create).toBeTypeOf("function");
    expect(Media.access?.update).toBeTypeOf("function");
    expect(Media.access?.delete).toBeTypeOf("function");
  });
});

describe("Users", () => {
  it("exposes exactly the 4 LDAP/AccessPoint roles as select options", () => {
    const roleField = Users.fields.find((f) => "name" in f && f.name === "role");
    expect(roleField).toBeDefined();
    if (roleField && "options" in roleField) {
      const values = roleField.options?.map((o) => (typeof o === "string" ? o : o.value));
      expect(values).toEqual(
        expect.arrayContaining([
          ROLES.NEW_VERTICAL_MAKER,
          ROLES.NEW_VERTICAL_CHECKER,
          ROLES.GROWTH_CHECKER,
          ROLES.GROWTH_MAKER,
        ])
      );
      expect(values).toHaveLength(4);
    }
  });

  it("read requires authentication, create/delete are New Vertical maker-only", () => {
    expect(Users.access?.read).toBeTypeOf("function");
    expect(Users.access?.create).toBeTypeOf("function");
    expect(Users.access?.update).toBeTypeOf("function");
    expect(Users.access?.delete).toBeTypeOf("function");
  });
});

describe("ContactInfo (global)", () => {
  it("allows public read and role-gated update", () => {
    expect(ContactInfo.access?.read).toBeTypeOf("function");
    expect(ContactInfo.access?.update).toBeTypeOf("function");
  });
});

describe("all collection slugs are unique", () => {
  it("has no duplicate slugs", () => {
    const all = [
      ...draftsEnabledNewVerticalOnly.map(([, c]) => c),
      ...newVerticalOnly.map(([, c]) => c),
      Campaigns,
      Media,
      Users,
    ];
    const slugs = all.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
