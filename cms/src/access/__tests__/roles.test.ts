import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import {
  campaignsCreate,
  campaignsReadWrite,
  denyMakerEditPublished,
  denyMakerPublish,
  growthCreate,
  growthReadWrite,
  isNewVerticalMaker,
  mediaCreate,
  newVerticalCreate,
  newVerticalReadWrite,
  ROLES,
  standardCreate,
  standardDelete,
  standardReadWrite,
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
  it("allows New Vertical maker and Growth maker", () => {
    expect(campaignsCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(true);
    expect(campaignsCreate({ req: reqWithRole(ROLES.GROWTH_MAKER) })).toBe(true);
  });

  // Follow-up 28.08: the business re-confirmed the role table — Growth
  // Checker approves/publishes, it never creates, on Campaigns same as
  // everywhere else now. The earlier reading (Checker can create too) is
  // no longer correct — see ROLES.GROWTH_CHECKER's comment.
  it("denies Growth checker — it approves, it doesn't create", () => {
    expect(campaignsCreate({ req: reqWithRole(ROLES.GROWTH_CHECKER) })).toBe(false);
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

  it("throws when GROWTH_MAKER tries to publish", async () => {
    await expect(call(ROLES.GROWTH_MAKER, "published")).rejects.toThrow();
  });

  it("allows GROWTH_MAKER to save a draft", async () => {
    await expect(call(ROLES.GROWTH_MAKER, "draft")).resolves.not.toThrow();
  });

  it("allows other roles to publish", async () => {
    await expect(call(ROLES.NEW_VERTICAL_MAKER, "published")).resolves.not.toThrow();
    await expect(call(ROLES.GROWTH_CHECKER, "published")).resolves.not.toThrow();
  });

  it("returns the data unchanged when it does not throw", async () => {
    const data = { _status: "draft", title: "x" };
    const result = await denyMakerPublish({ data, req: reqWithRole(ROLES.GROWTH_MAKER) } as never);
    expect(result).toBe(data);
  });
});

// Follow-up 28.08: Growth expanded from Campaigns-only to every "standard
// shape" collection New Vertical already had — these five are the generic
// building blocks every one of those collections wires in.
describe("growthCreate / growthReadWrite", () => {
  it("growthCreate allows only GROWTH_MAKER", () => {
    expect(growthCreate({ req: reqWithRole(ROLES.GROWTH_MAKER) })).toBe(true);
    expect(growthCreate({ req: reqWithRole(ROLES.GROWTH_CHECKER) })).toBe(false);
    expect(growthCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(false);
  });

  it("growthReadWrite allows both Growth roles, denies New Vertical", () => {
    expect(growthReadWrite({ req: reqWithRole(ROLES.GROWTH_MAKER) })).toBe(true);
    expect(growthReadWrite({ req: reqWithRole(ROLES.GROWTH_CHECKER) })).toBe(true);
    expect(growthReadWrite({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(false);
  });
});

describe("standardCreate / standardReadWrite / standardDelete", () => {
  it("standardCreate allows both makers, denies both checkers", () => {
    expect(standardCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) })).toBe(true);
    expect(standardCreate({ req: reqWithRole(ROLES.GROWTH_MAKER) })).toBe(true);
    expect(standardCreate({ req: reqWithRole(ROLES.NEW_VERTICAL_CHECKER) })).toBe(false);
    expect(standardCreate({ req: reqWithRole(ROLES.GROWTH_CHECKER) })).toBe(false);
  });

  it("standardReadWrite allows all four roles", () => {
    for (const role of Object.values(ROLES)) {
      expect(standardReadWrite({ req: reqWithRole(role) })).toBe(true);
    }
  });

  it("standardDelete: New Vertical maker can delete anything", () => {
    expect(standardDelete({ req: reqWithRole(ROLES.NEW_VERTICAL_MAKER) } as never)).toBe(true);
  });

  it("standardDelete: Growth maker can only delete its own drafts (scoped Where)", () => {
    const req = { user: { id: 42, role: ROLES.GROWTH_MAKER } } as unknown as PayloadRequest;
    expect(standardDelete({ req } as never)).toEqual({
      and: [{ _status: { equals: "draft" } }, { createdBy: { equals: 42 } }],
    });
  });

  it("standardDelete: both checkers can never delete", () => {
    expect(standardDelete({ req: reqWithRole(ROLES.NEW_VERTICAL_CHECKER) } as never)).toBe(false);
    expect(standardDelete({ req: reqWithRole(ROLES.GROWTH_CHECKER) } as never)).toBe(false);
  });
});

describe("denyMakerEditPublished", () => {
  const call = (role: string | undefined, operation: string, status: string | undefined, draftQuery = false) =>
    denyMakerEditPublished({
      data: {},
      operation,
      originalDoc: status ? { _status: status } : {},
      // Payload's REST handler coerces `?draft=true` to the boolean `true`
      // in place before any hook runs (see denyMakerEditPublished's doc
      // comment) — the mock mirrors that, not the raw query string.
      req: { user: role ? { role } : undefined, query: draftQuery ? { draft: true } : {} },
    } as never);

  it("throws when GROWTH_MAKER directly writes to an already-published document (no ?draft=true)", async () => {
    await expect(call(ROLES.GROWTH_MAKER, "update", "published")).rejects.toThrow();
  });

  /**
   * Follow-up 30.08: the panel's own Save/"Onaya Gönder" action always sends
   * `?draft=true` — verified live that this creates a pending version without
   * touching the live document, so it's the one case that should be let
   * through instead of forcing every edit through an unpublish-first flow.
   */
  it("allows GROWTH_MAKER to queue an edit via the safe ?draft=true save path", async () => {
    await expect(call(ROLES.GROWTH_MAKER, "update", "published", true)).resolves.not.toThrow();
  });

  it("allows GROWTH_MAKER to update its own draft", async () => {
    await expect(call(ROLES.GROWTH_MAKER, "update", "draft")).resolves.not.toThrow();
  });

  it("allows GROWTH_MAKER to create (not an update)", async () => {
    await expect(call(ROLES.GROWTH_MAKER, "create", "published")).resolves.not.toThrow();
  });

  it("allows every other role to edit a published document", async () => {
    await expect(call(ROLES.NEW_VERTICAL_MAKER, "update", "published")).resolves.not.toThrow();
    await expect(call(ROLES.NEW_VERTICAL_CHECKER, "update", "published")).resolves.not.toThrow();
    await expect(call(ROLES.GROWTH_CHECKER, "update", "published")).resolves.not.toThrow();
  });
});
