import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import { ROLES } from "@/access/roles";
import { AuditLogs } from "@/collections/AuditLogs";
import { getRolePermissionSummary } from "@/lib/rolePermissions";

/**
 * D4: rolePermissions.ts's MATRIX is a hand-maintained mirror of each
 * collection's real `access` block — there's no way to introspect Payload's
 * resolved access functions at the type level, so this test calls the REAL
 * `AuditLogs.access.read` function directly and asserts the matrix agrees
 * with what it actually returns for every role, instead of trusting the
 * matrix's own claim. Catches exactly the class of bug this test was
 * written for: the matrix said `view: false` for non-Maker roles while the
 * real access rule was a self-scoped Where (truthy, i.e. visible).
 */
function fakeReq(role: string, email: string): PayloadRequest {
  return { user: { role, email } } as unknown as PayloadRequest;
}

describe("AuditLogs matrix <-> access sync", () => {
  const roles = [ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_MAKER, ROLES.GROWTH_CHECKER];

  it.each(roles)("matrix view flag for %s matches whether the real access.read is truthy", (role) => {
    const req = fakeReq(role, `${role}@vodafonepay.local`);
    const readResult = (AuditLogs.access?.read as (args: { req: PayloadRequest }) => unknown)({ req });
    const isVisible = Boolean(readResult);

    const summary = getRolePermissionSummary("audit-logs", role, "tr");
    expect(summary).not.toBeNull();

    // "you cannot see this section" is the only line getRolePermissionSummary
    // emits when the matrix's view flag is false — used here as a proxy for
    // the matrix's view flag without needing to export MATRIX itself.
    const matrixSaysHidden = summary!.lines.some((line) => line.includes("Bu bölümü göremezsiniz"));

    expect(matrixSaysHidden).toBe(!isVisible);
  });

  it("New Vertical Maker sees every entry (access.read returns true, not a scoped Where)", () => {
    const req = fakeReq(ROLES.NEW_VERTICAL_MAKER, "maker@vodafonepay.local");
    const readResult = (AuditLogs.access?.read as (args: { req: PayloadRequest }) => unknown)({ req });
    expect(readResult).toBe(true);
  });

  it("every other role gets a self-scoped Where, not full access", () => {
    for (const role of [ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_MAKER, ROLES.GROWTH_CHECKER]) {
      const req = fakeReq(role, `${role}@vodafonepay.local`);
      const readResult = (AuditLogs.access?.read as (args: { req: PayloadRequest }) => unknown)({ req });
      expect(readResult).toEqual({ userEmail: { equals: `${role}@vodafonepay.local` } });
    }
  });
});
