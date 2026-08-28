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

/**
 * The rest of each row of the business-provided AccessPoint role table
 * (28.08.2026), kept next to the group-name mapping it belongs to.
 *
 * This is reference data, not access control — nothing here grants or denies
 * anything (that is `roles.ts`'s job). It exists so the CMS's own SOX access
 * matrix screen (`/admin/access-matrix`, via `lib/rolePermissions.ts`) can
 * show the real AccessPoint identity of each role — its group name, the
 * department that owns it, who approves a request for it, and its criticality
 * warning — instead of only our internal friendly label. An auditor reading
 * that screen can then line it up against the source role table directly.
 */
export type RoleDirectoryEntry = {
  /** The AccessPoint/AD group name — the key in LDAP_GROUP_TO_ROLE above. */
  ldapGroup: string;
  department: { tr: string; en: string };
  /** "Rol Sorumlusu" — who approves an AccessPoint request for this role. */
  approver: string;
  /** "Rol Kritik Mi?" — all four are critical in the source table. */
  critical: boolean;
  /** "Kritik pop up mesaj içeriği", verbatim from the role table. */
  criticalNotice: { tr: string; en: string };
  /** Short description of what the role may do, from the role table. */
  summary: { tr: string; en: string };
};

const CRITICAL_NOTICE = {
  tr: "Bu role sahip kullanıcı, sistemlerde bulunan kritik data'ya erişme ve ekleme/değiştirme/silme yetkisine sahiptir.",
  en: "A user holding this role can access critical data in the systems and add/change/delete it.",
};

export const ROLE_DIRECTORY: Record<RoleValue, RoleDirectoryEntry> = {
  [ROLES.NEW_VERTICAL_MAKER]: {
    ldapGroup: "RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW",
    department: { tr: "New Vertical", en: "New Vertical" },
    approver: "Tugay Kökden",
    critical: true,
    criticalNotice: CRITICAL_NOTICE,
    summary: {
      tr: "Panelin tüm alanlarında geliştirme ve değişiklik yapabilir; içeriği doğrudan canlıya alabilir. Maker'ların değişikliklerini onaylama yetkisi yoktur. FrontEnd developer lead'leri içindir.",
      en: "Can develop and change every area of the panel and publish directly. Cannot approve other makers' changes. Intended for front-end developer leads.",
    },
  },
  [ROLES.NEW_VERTICAL_CHECKER]: {
    ldapGroup: "RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW",
    department: { tr: "New Vertical", en: "New Vertical" },
    approver: "Mert Sarıhan",
    critical: true,
    criticalNotice: CRITICAL_NOTICE,
    summary: {
      tr: "Developer'ın yaptığı geliştirmeleri FE'de takip eder ve onaylar. Yeni nesne ekleyemez.",
      en: "Follows and approves the developers' work on the front end. Cannot create new objects.",
    },
  },
  [ROLES.GROWTH_CHECKER]: {
    ldapGroup: "ROLE_VODAFONEPAY_CMS_CHECKER_RO",
    department: { tr: "Vodafone Pay Growth", en: "Vodafone Pay Growth" },
    approver: "Mert Sarıhan",
    critical: true,
    criticalNotice: CRITICAL_NOTICE,
    summary: {
      tr: "Growth Maker'ın oluşturduğu içerikleri inceler, onaylar ve canlıya alır. Kendisi yeni içerik oluşturamaz.",
      en: "Reviews, approves and publishes the content a Growth Maker created. Cannot create content itself.",
    },
  },
  [ROLES.GROWTH_MAKER]: {
    ldapGroup: "ROLE_VODAFONEPAY_CMS_MAKER_RW",
    department: { tr: "Vodafone Pay Growth", en: "Vodafone Pay Growth" },
    approver: "Mert Sarıhan",
    critical: true,
    criticalNotice: CRITICAL_NOTICE,
    summary: {
      tr: "Yeni içerik oluşturabilir ve mevcut içerik üzerinde değişiklik yapabilir. Kendi değişikliğini onaylayamaz — Growth Checker onaylar.",
      en: "Can create new content and change existing content. Cannot approve its own change — a Growth Checker does.",
    },
  },
};
