import { APIError, Forbidden } from "payload";
import type { Access, CollectionBeforeChangeHook, Payload, PayloadRequest, Where } from "payload";

/**
 * Internal role slugs — deliberately NOT Vodafone AccessPoint's literal LDAP
 * group names. Until 2026-08-19 the four values here WERE the exact
 * AccessPoint strings (`RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW`, etc.),
 * which meant our own access-control code was directly coupled to one
 * specific AD group-naming scheme for exactly today's two business units
 * (New Vertical, Growth). Onboarding a third department meant inventing a
 * brand new ROLES entry + touching every collection that checks it, purely
 * because their AD group happened to have a different name.
 *
 * The fix is one layer of indirection: these four slugs are now our own
 * vocabulary, and `roleMapping.ts`'s `LDAP_GROUP_TO_ROLE` is where a real
 * AccessPoint/AD group name gets translated into one of them. A new
 * department that needs a permission shape we already have (e.g. "creates
 * content in one scope, can't publish it themselves" — what GROWTH_MAKER is
 * today) is *one line* in that mapping file: their AD group name → the
 * existing ROLES.GROWTH_MAKER value. No change here, no new collection
 * code, no new deploy of business logic — only a data-shaped config edit.
 *
 * This does NOT make the four *permission shapes* themselves infinitely
 * flexible — a department that needs a genuinely new shape (e.g. write
 * access to only 3 specific collections nobody else touches) still needs a
 * new ROLES entry and new access-control wiring, same as before. That
 * deeper limit is real and intentional — see docs/RFP-OPEN-ITEMS.md §3.1.12
 * ("Flexible/Extensible panel… bu, Payload'ı bırakıp başka bir mimariye
 * geçmeden kapanmaz"). What this change actually buys: reusing an existing
 * shape for a new group of people is now config, not code.
 */
export const ROLES = {
  /** "New Vertical" FE dev leads. Full CRUD + publish on every collection. */
  NEW_VERTICAL_MAKER: "new_vertical_maker",
  /** Reviews/publishes NEW_VERTICAL_MAKER's changes. Cannot create new documents. */
  NEW_VERTICAL_CHECKER: "new_vertical_checker",
  /**
   * Approves/publishes GROWTH_MAKER's drafts. Follow-up 28.08 (business
   * re-confirmed the role table): unlike the earlier reading of this role,
   * it does NOT create — "_RO" turned out to describe its actual capability
   * after all (approve + publish only), not just AccessPoint's naming
   * scheme. Scope was Campaigns-only; expanded 28.08 to every collection
   * GROWTH_MAKER can touch (see standardCreate/standardReadWrite below) —
   * Growth now mirrors New Vertical's content scope, not just Campaigns.
   */
  GROWTH_CHECKER: "growth_checker",
  /**
   * Creates/edits drafts. Can never publish its own work, and can never
   * touch an already-published document at all (see denyMakerPublish /
   * denyMakerEditPublished below) — a Checker always has to be the one who
   * takes something live. Scope was Campaigns-only; expanded 28.08 to every
   * collection New Vertical can touch, same as GROWTH_CHECKER above.
   */
  GROWTH_MAKER: "growth_maker",
} as const;

export type RoleValue = (typeof ROLES)[keyof typeof ROLES];

/**
 * Walkthrough 29.08: these were plain strings, so the Role select stayed
 * Turkish even with the panel switched to English — the one field on the
 * account screen that refused to translate. Payload takes a {tr,en} object
 * here exactly like every other label in this codebase.
 */
export const ROLE_OPTIONS = [
  {
    label: { tr: "New Vertical — Exec Developer (Maker, tüm alanlar)", en: "New Vertical — Exec Developer (Maker, all areas)" },
    value: ROLES.NEW_VERTICAL_MAKER,
  },
  {
    label: { tr: "New Vertical — Exec Content (Checker, tüm alanlar)", en: "New Vertical — Exec Content (Checker, all areas)" },
    value: ROLES.NEW_VERTICAL_CHECKER,
  },
  {
    label: {
      tr: "Growth — Checker (New Vertical ile aynı kapsam, sadece onaylar)",
      en: "Growth — Checker (same scope as New Vertical, approves only)",
    },
    value: ROLES.GROWTH_CHECKER,
  },
  {
    label: {
      tr: "Growth — Maker (New Vertical ile aynı kapsam, yayınlayamaz)",
      en: "Growth — Maker (same scope as New Vertical, cannot publish)",
    },
    value: ROLES.GROWTH_MAKER,
  },
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
 * Media isn't one of the 4 spec'd roles' explicit scopes, but both Growth
 * roles have to be able to upload a campaign image — Campaigns' `image`
 * field is required, and without this a Growth maker/checker could create a
 * campaign but never attach a picture to it. Everyone else follows the
 * standard New Vertical create rule.
 */
export const mediaCreate: Access = ({ req }) => {
  const role = roleOf(req);
  return role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.GROWTH_MAKER || role === ROLES.GROWTH_CHECKER;
};

/**
 * Follow-up 28.08: GROWTH_CHECKER's create right was removed here (see the
 * ROLES.GROWTH_CHECKER comment) — a Checker approves/publishes, it never
 * originates content, on Campaigns same as everywhere else now.
 */
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
  return async ({ data, operation, originalDoc, req }) => {
    if (roleOf(req) !== blockedRole) return data;
    if (data?._status !== "published") return data;

    // An active delegate stands in for an absent checker — see
    // hasActiveCheckerDelegate's doc comment.
    if (req.user?.id && (await hasActiveCheckerDelegate(req.payload, req.user.id))) return data;

    // The rule is "this role may never PUBLISH", i.e. never move a document
    // INTO the published state. It used to be written as "never save anything
    // whose resulting status is published", which also caught saves on a
    // document that was already live and staying live — so a Growth Maker
    // couldn't write even publication-neutral metadata.
    //
    // That surfaced as a real dead end once the unpublish flow landed (RFP
    // feedback 5.4): the Growth Maker's own "Yayından Kaldırma Talebi Oluştur"
    // button 403'd, because filing the request is a save on a still-published
    // document. Confirmed live before the fix.
    //
    // Relaxing this does NOT open a way to edit live content: on Campaigns,
    // `guardPublishedEdit` runs earlier in the same beforeChange chain and
    // rejects any content change while `_status` is published. This hook keeps
    // owning exactly one thing — the draft → published transition.
    if (operation === "update" && originalDoc?._status === "published") return data;

    throw new Forbidden(req.t);
  };
}

export const denyMakerPublish = denyRolePublish(ROLES.GROWTH_MAKER);

/**
 * Follow-up 28.08: Growth expanded from Campaigns-only to the same content
 * scope New Vertical has (business decision — Growth Maker/Checker now work
 * across every collection the CMS panel exposes, not just campaigns). These
 * five exports are the generic, collection-agnostic building blocks every
 * "standard shape" collection wires in below — see roles.test.ts for the
 * full per-role truth table.
 */

/** GROWTH_MAKER only — mirrors newVerticalCreate's shape for the Growth side. */
export const growthCreate: Access = ({ req }) => roleOf(req) === ROLES.GROWTH_MAKER;

/** GROWTH_MAKER or GROWTH_CHECKER — mirrors newVerticalReadWrite's shape for the Growth side. */
export const growthReadWrite: Access = ({ req }) => {
  const role = roleOf(req);
  return role === ROLES.GROWTH_MAKER || role === ROLES.GROWTH_CHECKER;
};

/** Either department's maker may create. */
export const standardCreate: Access = (args) => newVerticalCreate(args) || growthCreate(args);

/** Either department's maker or checker may update (subject to the publish/live-edit guards below). */
export const standardReadWrite: Access = (args) => newVerticalReadWrite(args) || growthReadWrite(args);

/**
 * Generic version of the own-draft-delete rule Campaigns already used
 * (`campaignsDelete`, now a thin wrapper around this) — NEW_VERTICAL_MAKER
 * may delete anything; GROWTH_MAKER may delete only its own, still-draft
 * documents; everyone else (both checkers) cannot delete at all.
 */
export const standardDelete: Access = (args) => {
  const { req } = args;
  if (isNewVerticalMaker(args)) return true;
  const role = roleOf(req);
  if (role === ROLES.GROWTH_MAKER && req.user?.id) {
    const where: Where = { and: [{ _status: { equals: "draft" } }, { createdBy: { equals: req.user.id } }] };
    return where;
  }
  return false;
};

/**
 * The other half of Growth's segregation of duties, alongside
 * `denyMakerPublish`: that hook only owns the draft→published TRANSITION,
 * so on its own a Growth Maker could still edit a document that was
 * already published and stays published (a publication-neutral save) —
 * silently bypassing the checker entirely. Campaigns closes this with its
 * own bespoke `guardPublishedEdit` (unpublish-request flow, emergency
 * `forceLiveEdit` escape hatch, `reviewStatus` tracking); replicating that
 * whole system on every other collection would mean copying its field set
 * and UI everywhere. This is the deliberately simpler version for
 * everything else: a Growth Maker may never touch an already-published
 * document at all, full stop — they ask a Checker (or New Vertical) to
 * unpublish it first, exactly like every other role already can via the
 * normal draft toggle.
 */
export const denyMakerEditPublished: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== "update" || originalDoc?._status !== "published") return data;
  if (roleOf(req) !== ROLES.GROWTH_MAKER) return data;

  const isEnglish = req.i18n?.language === "en";
  throw new APIError(
    isEnglish
      ? "You can't edit a published record — ask a Checker to unpublish it first."
      : "Yayındaki bir kaydı düzenleyemezsiniz — önce bir Checker'dan yayından kaldırmasını isteyin.",
    403,
    undefined,
    true
  );
};

/**
 * RFP §3.1 User Role Management: "Checker may delegate his/her rights to
 * another user if necessary (e.g while out of office or on leave)." A
 * checker names a delegate + optional expiry on their own Users doc
 * (`Users.ts`'s `delegateTo`/`delegationExpiresAt` fields, self-service like
 * `preferredLocale`). This is the one place that answers "is `userId`
 * currently standing in for an absent checker" — reused by `denyRolePublish`
 * (so a delegate can actually publish) and by `DashboardWidgets.tsx` (so the
 * delegate sees the review queue, not just the ability to act on it).
 *
 * Deliberately does NOT change the delegate's own `role` field — this is a
 * temporary, revocable capability grant, not a role reassignment. A Growth
 * Maker delegate still can't create content outside Campaigns, still can't
 * touch anything New Vertical-scoped; the delegation only lifts the ONE
 * "can't publish" restriction `denyRolePublish` would otherwise apply.
 */
export async function hasActiveCheckerDelegate(payload: Payload, userId: string | number): Promise<boolean> {
  const now = new Date().toISOString();
  const { totalDocs } = await payload.find({
    collection: "users",
    where: {
      and: [
        { delegateTo: { equals: userId } },
        { role: { in: [ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_CHECKER] } },
        { or: [{ delegationExpiresAt: { exists: false } }, { delegationExpiresAt: { greater_than: now } }] },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return totalDocs > 0;
}
