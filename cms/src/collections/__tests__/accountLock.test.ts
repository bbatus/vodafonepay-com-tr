import { describe, expect, it } from "vitest";
import type { Access, PayloadRequest } from "payload";
import { Users } from "@/collections/Users";
import { ROLES } from "@/access/roles";

/**
 * RFP feedback 5.6. Note what this is NOT testing: that lockout exists at all.
 * It already did — Payload's `addDefaultsToAuthConfig` applies
 * `maxLoginAttempts: 5` / `lockTime: 600000` to any auth config, so the
 * previous round's "not configured" comment was wrong and accounts were being
 * locked silently. These assertions pin the policy down as an explicit,
 * reviewable choice so a future edit can't quietly change it.
 */
const req = (role?: string) => ({ user: role ? { role, id: 1 } : undefined }) as unknown as PayloadRequest;
const call = (access: Access | undefined, role?: string) =>
  access?.({ req: req(role) } as Parameters<Access>[0]) ?? false;

describe("Users account lockout", () => {
  it("states the lockout policy explicitly rather than inheriting Payload's defaults", () => {
    const auth = Users.auth as { maxLoginAttempts?: number; lockTime?: number };
    expect(auth.maxLoginAttempts).toBe(5);
    expect(auth.lockTime).toBe(15 * 60 * 1000);
  });

  it("exposes lockUntil so a locked account is visible in the list", () => {
    const lockUntil = Users.fields.find((f) => "name" in f && f.name === "lockUntil");
    expect(lockUntil).toBeDefined();
    expect((lockUntil as { hidden?: boolean }).hidden).toBe(false);
    expect(Users.admin?.defaultColumns).toContain("lockUntil");
  });

  it("lets ONLY a New Vertical Maker clear a lock", () => {
    const unlock = Users.access?.unlock;
    expect(call(unlock, ROLES.NEW_VERTICAL_MAKER)).toBe(true);
    expect(call(unlock, ROLES.NEW_VERTICAL_CHECKER)).toBe(false);
    expect(call(unlock, ROLES.GROWTH_MAKER)).toBe(false);
    expect(call(unlock, ROLES.GROWTH_CHECKER)).toBe(false);
    expect(call(unlock, undefined)).toBe(false);
  });
});
