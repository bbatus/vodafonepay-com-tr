import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import {
  campaignsCreate,
  campaignsReadWrite,
  denyMakerPublish,
  isNewVerticalMaker,
  mediaCreate,
  newVerticalCreate,
  newVerticalReadWrite,
  ROLES,
} from "@/access/roles";

const reqWithRole = (role?: string) => ({ user: role ? { role } : undefined }) as unknown as PayloadRequest;

describe("isNewVerticalMaker", () => {
  it("is true only for the New Vertical maker role", () => {
    expect(isNewVerticalMaker({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(true);
    expect(isNewVerticalMaker({ req: reqWithRole(ROLES.NEW_VERTICAL_CHECKER) })).toBe(false);
    expect(isNewVerticalMaker({ req: reqWithRole(ROLES.GROWTH_MAKER) })).toBe(false);
    expect(isNewVerticalMaker({ req: reqWithRole(undefined) })).toBe(false);
  });
});

describe("newVerticalReadWrite / newVerticalCreate", () => {
  it("readWrite allows both New Vertical roles", () => {
    expect(newVerticalReadWrite({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(true);
    expect(newVerticalReadWrite({ req: reqWithRole(ROLES.NEW_VERTICAL_CHECKER) })).toBe(true);
  });

  it("readWrite denies Growth roles", () => {
    expect(newVerticalReadWrite({ req: reqWithRole(ROLES.GROWTH_MAKER) })).toBe(false);
    expect(newVerticalReadWrite({ req: reqWithRole(ROLES.GROWTH_CHECKER) })).toBe(false);
  });

  it("create only allows the New Vertical maker (checker cannot create)", () => {
    expect(newVerticalCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(true);
    expect(newVerticalCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_CHECKER) })).toBe(false);
  });
});

describe("mediaCreate", () => {
  it("allows New Vertical maker and both Growth roles (campaign image uploads)", () => {
    expect(mediaCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(true);
    expect(mediaCreate({ req: reqWithRole(ROLES.GROWTH_MAKER) })).toBe(true);
    expect(mediaCreate({ req: reqWithRole(ROLES.GROWTH_CHECKER) })).toBe(true);
  });

  it("denies the New Vertical checker", () => {
    expect(mediaCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_CHECKER) })).toBe(false);
  });
});

describe("campaignsCreate", () => {
  it("allows New Vertical maker and both Growth roles", () => {
    expect(campaignsCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(true);
    expect(campaignsCreate({ req: reqWithRole(ROLES.GROWTH_MAKER) })).toBe(true);
    // Growth Checker can create its own campaigns too, not just approve
    // GROWTH_MAKER's — the "_RO" in its LDAP name is AccessPoint's naming
    // convention, not a read-only restriction. See ROLES.GROWTH_CHECKER.
    expect(campaignsCreate({ req: reqWithRole(ROLES.GROWTH_CHECKER) })).toBe(true);
  });

  it("denies the New Vertical checker — it approves, it doesn't create", () => {
    expect(campaignsCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_CHECKER) })).toBe(false);
  });
});

describe("campaignsReadWrite", () => {
  it("allows all four roles", () => {
    for (const role of Object.values(ROLES)) {
      expect(campaignsReadWrite({ req: reqWithRole(role) })).toBe(true);
    }
  });

  it("denies unauthenticated requests", () => {
    expect(campaignsReadWrite({ req: reqWithRole(undefined) })).toBe(false);
  });
});

describe("denyMakerPublish", () => {
  const call = (role: string | undefined, status: string | undefined) =>
    denyMakerPublish({
      data: status ? { _status: status } : {},
      req: reqWithRole(role),
    } as never);

  it("throws when GROWTH_MAKER tries to publish", () => {
    expect(() => call(ROLES.GROWTH_MAKER, "published")).toThrow();
  });

  it("allows GROWTH_MAKER to save a draft", () => {
    expect(() => call(ROLES.GROWTH_MAKER, "draft")).not.toThrow();
  });

  it("allows other roles to publish", () => {
    expect(() => call(ROLES.NEW_VERTICAL_MAKER, "published")).not.toThrow();
    expect(() => call(ROLES.GROWTH_CHECKER, "published")).not.toThrow();
  });

  it("returns the data unchanged when it does not throw", () => {
    const data = { _status: "draft", title: "x" };
    const result = denyMakerPublish({ data, req: reqWithRole(ROLES.GROWTH_MAKER) } as never);
    expect(result).toBe(data);
  });
});
