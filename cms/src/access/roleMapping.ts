import { ROLES, type RoleValue } from "@/access/roles";

/**
 * Translation layer between "whatever group name AccessPoint/LDAP hands us"
 * and our own internal role slugs (`ROLES.*` in `roles.ts`). NOT wired into
 * an auth strategy yet — there's no real LDAP bind in this environment (see
 * docs/RFP-OPEN-ITEMS.md §6), so nothing calls `resolveRoleFromLdapGroups`
 * today. This file exists now so the *shape* of that future integration is
 * settled: step (1) of §6's "LDAP bağlanınca yapılacaklar" list is "add a
 * custom authStrategy" — that strategy's job ends at producing a list of AD
 * group names, and `resolveRoleFromLdapGroups` below is what turns that into
 * a `role` value the rest of the codebase already understands.
 *
 * Onboarding a new department that fits an EXISTING permission shape (full
 * scope, or campaigns-only scope) is exactly one new line here — map their
 * AD group's name to the matching `ROLES.*` value. Nothing else changes: no
 * new collection code, no new access-control function, no new deploy of
 * business logic. A department that needs a genuinely new permission shape
 * (write access to some other specific subset of collections) still needs a
 * new `ROLES` entry and new access-control wiring — see the comment on
 * `ROLES` in roles.ts for why that boundary is real, not an oversight.
 */
export const LDAP_GROUP_TO_ROLE: Record<string, RoleValue> = {
  // Today's two business units, as given by AccessPoint's own role table —
  // kept here (not in roles.ts) specifically so the AD-facing name and the
  // internal slug it resolves to are edited in one place, independent of
  // roles.ts's own permission-shape logic.
  RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW: ROLES.NEW_VERTICAL_MAKER,
  RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW: ROLES.NEW_VERTICAL_CHECKER,
  ROLE_VODAFONEPAY_CMS_CHECKER_RO: ROLES.GROWTH_CHECKER,
  ROLE_VODAFONEPAY_CMS_MAKER_RW: ROLES.GROWTH_MAKER,
};

/**
 * Given the list of AD group names a directory lookup returned for a user,
 * picks the role to assign them. A user in multiple mapped groups gets the
 * FIRST match in `LDAP_GROUP_TO_ROLE`'s own key order — precedence is
 * whichever group was registered first below, not group "seniority"; if two
 * departments ever legitimately overlap for the same person, list the more
 * privileged group's key earlier.
 *
 * Returns undefined for a user with no mapped group — per
 * docs/RFP-OPEN-ITEMS.md §6, that user must be denied login entirely, not
 * defaulted to any role.
 */
export function resolveRoleFromLdapGroups(groups: string[]): RoleValue | undefined {
  for (const group of Object.keys(LDAP_GROUP_TO_ROLE)) {
    if (groups.includes(group)) return LDAP_GROUP_TO_ROLE[group];
  }
  return undefined;
}
