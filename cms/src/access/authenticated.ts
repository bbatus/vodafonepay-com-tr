import { Forbidden } from "payload";
import type { Access, CollectionBeforeOperationHook } from "payload";

/** Requires a logged-in session. Use as `readVersions` on drafts-enabled collections. */
export const authenticated: Access = ({ req }) => Boolean(req.user);

/**
 * For the `read` access of any collection with `versions.drafts: true`.
 * Logged-in users see everything (including drafts); everyone else only
 * ever sees documents where `_status` is `published`.
 *
 * NOTE: on its own this is NOT sufficient to keep drafts private — see
 * `denyUnauthenticatedDraftRead` below for why, and use both together.
 */
export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: "published" } };
};

/**
 * `read: () => true` plus a `Where`-returning access function is the
 * documented pattern for "public sees published, editors see drafts" — but
 * it does NOT hold for Payload's `?draft=true` query param specifically.
 * `findByID`/`find` with `draft=true` re-fetches from the versions table via
 * `replaceWithDraftIfAvailable`, and empirically (tested against this exact
 * collection set: Campaigns/BlogPosts/FaqItems/Announcements) the merged
 * `version._status` access constraint does not end up excluding the draft —
 * `GET /api/campaigns/:id?draft=true` returned unpublished content with zero
 * auth even with `publishedOrAuthenticated` as `read` and `authenticated` as
 * `readVersions`. Rather than depend on undocumented internal query-merge
 * behavior, this hook blocks the request outright before Payload's own draft
 * logic runs. Wire into every drafts-enabled collection as
 * `hooks.beforeOperation`.
 */
export const denyUnauthenticatedDraftRead: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  const wantsDraft = "draft" in args && args.draft === true;
  if ((operation === "read") && wantsDraft && !req.user) {
    throw new Forbidden(req.t);
  }
  return args;
};
