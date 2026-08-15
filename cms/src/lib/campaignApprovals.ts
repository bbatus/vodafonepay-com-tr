import type { Payload } from "payload";

export type ApprovalCounts = { approved: number; rejected: number; total: number };
export type PendingCampaign = { id: string | number; title: string; createdByEmail?: string };

/**
 * D1/D2: pulled out of WaitingApprovalsView.tsx (deleted — see git history)
 * and DashboardWidgets.tsx's own near-duplicate `loadPendingCampaigns`, so
 * there is exactly one place that knows how to compute these instead of two
 * drifting copies.
 */
export async function loadApprovalCounts(payload: Payload): Promise<ApprovalCounts> {
  const [approvedRes, rejectedRes, totalRes] = await Promise.all([
    payload.count({
      collection: "audit-logs",
      where: { and: [{ action: { equals: "publish" } }, { collectionSlug: { equals: "campaigns" } }] },
      overrideAccess: true,
    }),
    payload.count({
      collection: "audit-logs",
      where: { and: [{ action: { equals: "rejected" } }, { collectionSlug: { equals: "campaigns" } }] },
      overrideAccess: true,
    }),
    payload.count({
      collection: "audit-logs",
      where: { and: [{ action: { equals: "create" } }, { collectionSlug: { equals: "campaigns" } }] },
      overrideAccess: true,
    }),
  ]);
  return { approved: approvedRes.totalDocs, rejected: rejectedRes.totalDocs, total: totalRes.totalDocs };
}

/**
 * Every campaign draft currently awaiting a Checker's decision, across all
 * Makers. `findVersions` (not `find`, even with `draft: true`) is required
 * both to avoid `denyUnauthenticatedDraftRead` blocking this unauthenticated
 * Local API call, and to see a Maker's plain draft resubmission — the base
 * "campaigns" table only reflects the latest PUBLISH.
 */
export async function loadPendingCampaigns(payload: Payload, limit = 50): Promise<PendingCampaign[]> {
  const { docs } = await payload.findVersions({
    collection: "campaigns",
    where: {
      and: [
        { latest: { equals: true } },
        { "version._status": { equals: "draft" } },
        { "version.reviewStatus": { equals: "pending" } },
      ],
    },
    sort: "-updatedAt",
    limit,
    depth: 1,
    overrideAccess: true,
  });
  return docs.map((d) => {
    const doc = d as unknown as {
      parent: string | number;
      version: { title?: string; createdBy?: { email?: string } | string | null };
    };
    return {
      id: doc.parent,
      title: doc.version.title ?? String(doc.parent),
      createdByEmail: typeof doc.version.createdBy === "object" && doc.version.createdBy ? doc.version.createdBy.email : undefined,
    };
  });
}

export type OwnDraft = { id: string | number; title: string; reviewStatus?: string; rejectionReason?: string };

/**
 * D1: a Maker's OWN drafts still awaiting review or sent back rejected —
 * the thing a Maker actually wants to know at a glance, as opposed to the
 * Checker-facing "everyone's pending items" list above.
 */
export async function loadOwnDrafts(payload: Payload, userId: string | number, limit = 50): Promise<OwnDraft[]> {
  const { docs } = await payload.findVersions({
    collection: "campaigns",
    where: {
      and: [
        { latest: { equals: true } },
        { "version._status": { equals: "draft" } },
        { "version.createdBy": { equals: userId } },
      ],
    },
    sort: "-updatedAt",
    limit,
    depth: 0,
    overrideAccess: true,
  });
  return docs.map((d) => {
    const doc = d as unknown as {
      parent: string | number;
      version: { title?: string; reviewStatus?: string; rejectionReason?: string };
    };
    return {
      id: doc.parent,
      title: doc.version.title ?? String(doc.parent),
      reviewStatus: doc.version.reviewStatus,
      rejectionReason: doc.version.rejectionReason,
    };
  });
}
