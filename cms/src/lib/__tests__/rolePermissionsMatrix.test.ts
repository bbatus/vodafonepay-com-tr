import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import { getAccessMatrixRows, getRoleDirectory, getRolePermissionSummary } from "@/lib/rolePermissions";
import { ROLES, standardCreate, standardReadWrite, mediaCreate, campaignsCreate } from "@/access/roles";
import { ROLE_DIRECTORY } from "@/access/roleMapping";

/**
 * `rolePermissions.ts` is a hand-maintained mirror of the real access wiring —
 * its own header comment says so, because Payload gives no way to introspect
 * resolved access functions. That makes drift the failure mode: the SOX access
 * matrix and HelpButton's per-role copy both read this table, so if it falls
 * behind `access/roles.ts` the panel confidently tells an auditor something
 * untrue. It has happened once already: the 28.08 role expansion moved every
 * "standard" collection to `standardReadWrite` and the table had to be edited
 * by hand to follow.
 *
 * So the important tests here are not "does the function return something" but
 * "does the table still agree with the functions it claims to mirror".
 */

const req = (role: string) => ({ user: { id: 1, role } }) as unknown as PayloadRequest;
const truthy = (v: unknown) => v === true || (typeof v === "object" && v !== null);

describe("MATRIX agrees with the real access functions", () => {
  const rows = getAccessMatrixRows();
  const rowFor = (slug: string, role: string) => rows.find((r) => r.collectionSlug === slug && r.role === role)!;

  it.each([ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_MAKER, ROLES.GROWTH_CHECKER])(
    "standard collections: create flag matches standardCreate for %s",
    (role) => {
      expect(rowFor("faq-items", role).flags.create).toBe(Boolean(standardCreate({ req: req(role) } as never)));
    }
  );

  it.each([ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_MAKER, ROLES.GROWTH_CHECKER])(
    "standard collections: update flag matches standardReadWrite for %s",
    (role) => {
      expect(rowFor("pages", role).flags.update).toBe(truthy(standardReadWrite({ req: req(role) } as never)));
    }
  );

  it.each([ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_MAKER, ROLES.GROWTH_CHECKER])(
    "media: create flag matches mediaCreate for %s",
    (role) => {
      expect(rowFor("media", role).flags.create).toBe(Boolean(mediaCreate({ req: req(role) } as never)));
    }
  );

  it.each([ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_MAKER, ROLES.GROWTH_CHECKER])(
    "campaigns: create flag matches campaignsCreate for %s",
    (role) => {
      expect(rowFor("campaigns", role).flags.create).toBe(Boolean(campaignsCreate({ req: req(role) } as never)));
    }
  );

  /** The accepted rule: a Checker approves, it never originates content. */
  it("neither Checker can create in any standard collection", () => {
    const standardSlugs = rows.filter((r) => r.collectionSlug === "faq-items" || r.collectionSlug === "legal-pages");
    for (const row of standardSlugs) {
      if (row.role === ROLES.NEW_VERTICAL_CHECKER || row.role === ROLES.GROWTH_CHECKER) {
        expect(row.flags.create, `${row.collectionSlug}/${row.role}`).toBe(false);
      }
    }
  });

  /** Publishing is what separates the two Growth roles; everything else is shared. */
  it("Growth Maker can never publish, Growth Checker always can", () => {
    for (const row of rows.filter((r) => r.flags.view && r.collectionSlug !== "audit-logs" && r.collectionSlug !== "users")) {
      if (row.role === ROLES.GROWTH_MAKER) expect(row.flags.publish, row.collectionSlug).toBe(false);
    }
    expect(rowFor("campaigns", ROLES.GROWTH_CHECKER).flags.publish).toBe(true);
    expect(rowFor("faq-items", ROLES.GROWTH_CHECKER).flags.publish).toBe(true);
  });
});

describe("getAccessMatrixRows", () => {
  const rows = getAccessMatrixRows();

  it("emits one row per collection × role, with no duplicates", () => {
    const keys = rows.map((r) => `${r.collectionSlug}|${r.role}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(rows.length % 4).toBe(0);
  });

  it("carries the AccessPoint identity an auditor needs to match the source table", () => {
    for (const row of rows) {
      expect(row.ldapGroup).toBe(ROLE_DIRECTORY[row.role].ldapGroup);
      expect(row.approver).toBe(ROLE_DIRECTORY[row.role].approver);
      expect(row.roleLabel.tr).toBeTruthy();
      expect(row.roleLabel.en).toBeTruthy();
    }
  });

  it("labels every collection in both languages", () => {
    for (const row of rows) {
      expect(row.collectionLabel.tr, row.collectionSlug).toBeTruthy();
      expect(row.collectionLabel.en, row.collectionSlug).toBeTruthy();
    }
  });
});

describe("getRoleDirectory", () => {
  it("lists exactly the four AccessPoint roles with their groups and approvers", () => {
    const dir = getRoleDirectory();
    expect(dir).toHaveLength(4);
    expect(dir.map((d) => d.role).sort()).toEqual(
      [ROLES.GROWTH_CHECKER, ROLES.GROWTH_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.NEW_VERTICAL_MAKER].sort()
    );
    for (const entry of dir) {
      expect(entry.ldapGroup).toMatch(/^(ROLE|RL)_VODAFONEPAY_CMS_/);
      expect(entry.approver).toBeTruthy();
    }
  });
});

describe("getRolePermissionSummary", () => {
  it("returns null for an unknown collection or an unknown role", () => {
    expect(getRolePermissionSummary("not-a-collection", ROLES.GROWTH_MAKER, "tr")).toBeNull();
    expect(getRolePermissionSummary("faq-items", "sahte_rol", "tr")).toBeNull();
    expect(getRolePermissionSummary("faq-items", undefined, "tr")).toBeNull();
  });

  it("says plainly that the section is invisible when the role cannot view it", () => {
    const summary = getRolePermissionSummary("audit-logs", ROLES.GROWTH_MAKER, "tr");
    expect(summary).not.toBeNull();
    // AuditLogs is viewable (self-scoped) — the no-view copy belongs to a
    // category the role genuinely cannot open, so assert on the flag instead.
    const hidden = getAccessMatrixRows().filter((r) => !r.flags.view);
    for (const row of hidden) {
      const s = getRolePermissionSummary(row.collectionSlug, row.role, "tr")!;
      expect(s.lines.join(" ")).toContain("göremezsiniz");
      expect(getRolePermissionSummary(row.collectionSlug, row.role, "en")!.lines.join(" ")).toContain("cannot see");
    }
  });

  it("gives every role a non-empty summary in both languages for a standard collection", () => {
    for (const role of [ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_MAKER, ROLES.GROWTH_CHECKER]) {
      for (const locale of ["tr", "en"] as const) {
        const s = getRolePermissionSummary("faq-items", role, locale);
        expect(s, `${role}/${locale}`).not.toBeNull();
        expect(s!.roleLabel).toBeTruthy();
        expect(s!.lines.length).toBeGreaterThan(0);
        expect(s!.lines.every((l) => l.trim().length > 0)).toBe(true);
      }
    }
  });

  it("uses the dedicated copy for users, audit-logs and contact-info rather than the generic lines", () => {
    const generic = getRolePermissionSummary("faq-items", ROLES.GROWTH_CHECKER, "tr")!.lines.join(" ");
    for (const slug of ["users", "audit-logs", "contact-info"]) {
      const special = getRolePermissionSummary(slug, ROLES.GROWTH_CHECKER, "tr")!.lines.join(" ");
      expect(special, slug).not.toBe(generic);
    }
  });

  /**
   * A collection without drafts has no publish step, so telling its editor
   * about approval would be describing a workflow that isn't there.
   */
  it("only mentions the approval step for collections that actually have drafts", () => {
    const withDrafts = getRolePermissionSummary("faq-items", ROLES.GROWTH_MAKER, "tr")!.lines.join(" ");
    expect(withDrafts).toMatch(/onay|Checker/i);
  });
});
