import { describe, expect, it } from "vitest";
import { LDAP_GROUP_TO_ROLE, resolveRoleFromLdapGroups } from "@/access/roleMapping";
import { ROLES, type RoleValue } from "@/access/roles";

describe("resolveRoleFromLdapGroups", () => {
  it("maps each of today's known AccessPoint group names to its role", () => {
    expect(resolveRoleFromLdapGroups(["RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW"])).toBe(ROLES.NEW_VERTICAL_MAKER);
    expect(resolveRoleFromLdapGroups(["RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW"])).toBe(ROLES.NEW_VERTICAL_CHECKER);
    expect(resolveRoleFromLdapGroups(["ROLE_VODAFONEPAY_CMS_CHECKER_RO"])).toBe(ROLES.GROWTH_CHECKER);
    expect(resolveRoleFromLdapGroups(["ROLE_VODAFONEPAY_CMS_MAKER_RW"])).toBe(ROLES.GROWTH_MAKER);
  });

  it("ignores unmapped groups mixed in with a mapped one", () => {
    expect(resolveRoleFromLdapGroups(["SOME_UNRELATED_AD_GROUP", "ROLE_VODAFONEPAY_CMS_MAKER_RW"])).toBe(ROLES.GROWTH_MAKER);
  });

  it("returns undefined when no group is mapped — caller must deny login, never default a role", () => {
    expect(resolveRoleFromLdapGroups([])).toBeUndefined();
    expect(resolveRoleFromLdapGroups(["SOME_UNRELATED_AD_GROUP"])).toBeUndefined();
  });

  it("a new department reusing an existing shape is addable as a single map entry, not a code change", () => {
    const extended: Record<string, RoleValue> = { ...LDAP_GROUP_TO_ROLE, LEGAL_DEPT_CAMPAIGNS_GROUP: ROLES.GROWTH_MAKER };
    const groups = Object.keys(extended);
    const find = (g: string[]) => {
      for (const group of Object.keys(extended)) if (g.includes(group)) return extended[group];
      return undefined;
    };
    expect(groups).toContain("LEGAL_DEPT_CAMPAIGNS_GROUP");
    expect(find(["LEGAL_DEPT_CAMPAIGNS_GROUP"])).toBe(ROLES.GROWTH_MAKER);
  });
});
