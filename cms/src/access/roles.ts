import { Forbidden } from "payload";
import type { Access, CollectionBeforeChangeHook, PayloadRequest } from "payload";

/**
 * Exact LDAP/AccessPoint role names (vodafone.local). These strings are the
 * contract with Vodafone's AccessPoint provisioning system — do not rename
 * them, they must match 1:1 once real LDAP is wired in.
 */
export const ROLES = {
  /** "New Vertical" FE dev leads. Full CRUD + publish on every collection. */
  NEW_VERTICAL_MAKER: "RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW",
  /** Reviews/publishes NEW_VERTICAL_MAKER's changes. Cannot create new documents. */
  NEW_VERTICAL_CHECKER: "RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW",
  /** Approves/publishes GROWTH_MAKER's campaigns. Cannot create. */
  GROWTH_CHECKER: "ROLE_VODAFONEPAY_CMS_CHECKER_RO",
  /** Creates/edits campaigns. Can never publish its own work. */
  GROWTH_MAKER: "ROLE_VODAFONEPAY_CMS_MAKER_RW",
} as const;

export type RoleValue = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_OPTIONS = [
  { label: "New Vertical — Exec Developer (Maker, tüm alanlar)", value: ROLES.NEW_VERTICAL_MAKER },
  { label: "New Vertical — Exec Content (Checker, tüm alanlar)", value: ROLES.NEW_VERTICAL_CHECKER },
  { label: "Growth — Checker (sadece Campaigns)", value: ROLES.GROWTH_CHECKER },
  { label: "Growth — Maker (sadece Campaigns)", value: ROLES.GROWTH_MAKER },
];

const roleOf = (req: PayloadRequest): RoleValue | undefined => {
  const role = (req.user as { role?: string } | undefined)?.role;
  return role as RoleValue | undefined;
};

/** NEW_VERTICAL_MAKER only — full access, everywhere, including Users management. */
export const isNewVerticalMaker: Access = ({ req }) => roleOf(req) === ROLES.NEW_VERTICAL_MAKER;

/**
 * Read/update access for collections "New Vertical Panel üzerindeki tüm
 * alanlar" covers: everything except Campaigns' Growth-only create path.
 * Both New Vertical roles can touch these; only the maker can create.
 */
export const newVerticalReadWrite: Access = ({ req }) => {
  const role = roleOf(req);
  return role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.NEW_VERTICAL_CHECKER;
};

export const newVerticalCreate: Access = isNewVerticalMaker;

/**
 * Campaigns is the one collection with dual ownership: New Vertical (full
 * scope) AND Vodafone Pay Growth (campaigns only). Create: New Vertical
 * maker or Growth maker. Publish restriction is enforced separately in
 * `denyMakerPublish` — access control alone can't express "may update but
 * only as a draft".
 */
/**
 * Media isn't one of the 4 spec'd roles' explicit scopes, but GROWTH_MAKER
 * has to be able to upload a campaign image — Campaigns' `image` field is
 * required, and without this a Growth maker could create a campaign but
 * never attach a picture to it. Everyone else follows the standard New
 * Vertical create rule.
 */
export const mediaCreate: Access = ({ req }) => {
  const role = roleOf(req);
  return role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.GROWTH_MAKER;
};

export const campaignsCreate: Access = ({ req }) => {
  const role = roleOf(req);
  return role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.GROWTH_MAKER;
};

export const campaignsReadWrite: Access = ({ req }) => {
  const role = roleOf(req);
  return (
    role === ROLES.NEW_VERTICAL_MAKER ||
    role === ROLES.NEW_VERTICAL_CHECKER ||
    role === ROLES.GROWTH_MAKER ||
    role === ROLES.GROWTH_CHECKER
  );
};

/**
 * Factory for a maker/checker segregation-of-duties hook: the given role may
 * create/edit but can never flip `_status` to "published" itself — some
 * other role (a checker, or a role with broader rights) must do that.
 *
 * Enforced as a `beforeChange` hook rather than access-control alone: we
 * learned the hard way on the draft-read leak (see denyUnauthenticatedDraftRead
 * in authenticated.ts) that Payload's access-result merging for
 * draft/version operations does not reliably behave the way the docs
 * describe — a hook that inspects the actual incoming data and throws is
 * the only way we've verified actually holds up.
 *
 * Only GROWTH_MAKER uses this today. NEW_VERTICAL_MAKER is deliberately
 * NOT wrapped in this — its role definition (given verbatim by the business,
 * not something this codebase can redefine) explicitly grants it direct
 * publish rights ("canlıya uygulayabilir"); NEW_VERTICAL_CHECKER exists as a
 * separate update-without-create role, not as a publish gate on the maker.
 * Applying this hook to NEW_VERTICAL_MAKER would silently violate that
 * given role table, so it stays maker/checker-generic (any future role can
 * reuse it) rather than hardcoded to the one case it currently covers.
 */
export function denyRolePublish(blockedRole: RoleValue): CollectionBeforeChangeHook {
  return ({ data, req }) => {
    if (roleOf(req) === blockedRole && data?._status === "published") {
      throw new Forbidden(req.t);
    }
    return data;
  };
}

export const denyMakerPublish = denyRolePublish(ROLES.GROWTH_MAKER);
