import type { Payload } from "payload";
import { COLLECTION_LABELS, DRAFT_ENABLED_COLLECTIONS } from "@/lib/collectionLabels";

/**
 * The approval queue behind both dashboard widgets.
 *
 * Replaces the Campaigns-only `campaignApprovals.ts` (29.08). Those two
 * functions queried the `campaigns` collection and nothing else, so a Maker's
 * "Taslaklarınız" and a Checker's review list both silently ignored the other
 * thirteen drafts-enabled collections — a Maker could send a page, an FAQ or a
 * fee row for approval and neither role's dashboard would ever mention it.
 * That was true from the day Growth's scope grew past Campaigns (28.08); the
 * widgets were written when Campaigns really was the only thing either role
 * could touch, and nobody revisited them.
 *
 * What "waiting for approval" means depends on the collection:
 *
 *  - Campaigns has its own richer review cycle (`reviewStatus`
 *    pending/rejected, `rejectionReason`), so a REJECTED campaign is back
 *    with its Maker and must not sit in the Checker's queue.
 *  - Every other collection has no such field. There, a Growth Maker simply
 *    cannot publish (`denyMakerPublish`) and cannot touch a published record
 *    (`denyMakerEditPublished`), so "latest version is a draft" IS the
 *    complete definition of waiting.
 *
 * `findVersions` rather than `find`, for the same two reasons the Campaigns
 * version did: the base table only ever reflects the latest PUBLISH, so a
 * resubmitted draft is invisible there, and `denyUnauthenticatedDraftRead`
 * blocks the unauthenticated Local API read these make.
 */

export type ApprovalItem = {
  id: string | number;
  collectionSlug: string;
  collectionLabel: string;
  title: string;
  createdByEmail?: string;
  /** Campaigns only — absent everywhere else, where a draft is just a draft. */
  reviewStatus?: string;
  rejectionReason?: string;
  updatedAt?: string;
  /** Where the row should actually take you. Not always the collection route — see HIDDEN_COLLECTION_HREF. */
  href: string;
};

/** `useAsTitle` per collection — what the panel itself calls each record. */
const TITLE_FIELD: Record<string, string> = {
  campaigns: "title",
  "faq-items": "question",
  "blog-posts": "title",
  announcements: "title",
  pages: "title",
  "fee-rows": "label",
  "limit-tables": "title",
  "nav-links": "label",
  "legal-pages": "title",
  "cookie-rows": "name",
  "page-meta": "pageKey",
  categories: "label",
  representatives: "businessName",
  documents: "filename",
};

/**
 * Three collections are `admin.hidden`, so `/admin/collections/<slug>/<id>`
 * genuinely 404s for them (Payload's Document view checks `visibleEntities`).
 * Linking a dashboard row straight there would drop the editor on an error
 * page — the same defect that made creating a fee row land on a black 404
 * before the drawer fix. Send them to the screen that actually edits the
 * record instead.
 */
const HIDDEN_COLLECTION_HREF: Record<string, string> = {
  "fee-rows": "/admin/fees-and-limits",
  "limit-tables": "/admin/fees-and-limits",
  documents: "/admin/collections/legal-pages",
};

const hrefFor = (slug: string, id: string | number) =>
  HIDDEN_COLLECTION_HREF[slug] ?? `/admin/collections/${slug}/${id}`;

type VersionRow = {
  parent: string | number;
  updatedAt?: string;
  version: Record<string, unknown> & {
    createdBy?: { email?: string } | string | number | null;
    reviewStatus?: string;
    rejectionReason?: string;
  };
};

function toItem(slug: string, row: VersionRow, locale: "tr" | "en"): ApprovalItem {
  const titleField = TITLE_FIELD[slug] ?? "title";
  const rawTitle = row.version[titleField];
  const createdBy = row.version.createdBy;
  return {
    id: row.parent,
    collectionSlug: slug,
    collectionLabel: COLLECTION_LABELS[slug]?.[locale] ?? slug,
    title: typeof rawTitle === "string" && rawTitle.trim() ? rawTitle : `#${row.parent}`,
    createdByEmail: typeof createdBy === "object" && createdBy ? createdBy.email : undefined,
    reviewStatus: row.version.reviewStatus,
    rejectionReason: row.version.rejectionReason,
    updatedAt: row.updatedAt,
    href: hrefFor(slug, row.parent),
  };
}

/** Newest first, so the queue reads like an inbox. */
const byNewest = (a: ApprovalItem, b: ApprovalItem) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");

async function queryDrafts(
  payload: Payload,
  slug: string,
  extraWhere: Record<string, unknown>[],
  limit: number
): Promise<VersionRow[]> {
  try {
    const { docs } = await payload.findVersions({
      collection: slug as never,
      where: { and: [{ latest: { equals: true } }, { "version._status": { equals: "draft" } }, ...extraWhere] } as never,
      sort: "-updatedAt",
      limit,
      // depth 1 so `createdBy` arrives as a user object with an email on it.
      depth: 1,
      overrideAccess: true,
    });
    return docs as unknown as VersionRow[];
  } catch {
    // A collection without a versions table (or one mid-migration) must not
    // take the whole dashboard down with it.
    return [];
  }
}

/** Only the collections this role is allowed to see, and only those with drafts. */
const draftsIn = (slugs: string[]) => slugs.filter((slug) => DRAFT_ENABLED_COLLECTIONS.has(slug));

/**
 * Everything waiting on a Checker, across every collection in their scope and
 * from every Maker — not just Campaigns.
 */
export async function loadPendingApprovals(
  payload: Payload,
  slugs: string[],
  locale: "tr" | "en",
  limitPerCollection = 25
): Promise<ApprovalItem[]> {
  const results = await Promise.all(
    draftsIn(slugs).map(async (slug) => {
      // Campaigns: a rejected draft is back with its Maker, not awaiting review.
      const extra = slug === "campaigns" ? [{ "version.reviewStatus": { equals: "pending" } }] : [];
      const rows = await queryDrafts(payload, slug, extra, limitPerCollection);
      return rows.map((row) => toItem(slug, row, locale));
    })
  );
  return results.flat().sort(byNewest);
}

/**
 * A Maker's own in-flight work — what they submitted and what came back
 * rejected — across every collection in their scope.
 */
export async function loadOwnPendingDrafts(
  payload: Payload,
  userId: string | number,
  slugs: string[],
  locale: "tr" | "en",
  limitPerCollection = 25
): Promise<ApprovalItem[]> {
  const results = await Promise.all(
    draftsIn(slugs).map(async (slug) => {
      const rows = await queryDrafts(payload, slug, [{ "version.createdBy": { equals: userId } }], limitPerCollection);
      return rows.map((row) => toItem(slug, row, locale));
    })
  );
  return results.flat().sort(byNewest);
}
