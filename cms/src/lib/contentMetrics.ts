import type { Payload } from "payload";

/**
 * Two dashboard numbers sourced from `audit-logs`, requested to give the
 * dashboard's KPI row an operational-visibility angle beyond "how much
 * content exists" — how much of it moved this month, and how long it
 * typically waits.
 *
 * `avgApprovalHours` is a proxy, not an exact measurement: audit-logs has no
 * dedicated "submitted for review" event, only `create`/`update`/`publish`.
 * For each `publish` row this month, this finds the record's own most recent
 * `create`/`update` row that happened before it — the edit that got approved
 * — and averages `publish.createdAt - thatEdit.createdAt`. That IS the real
 * wait: a Growth Maker can keep editing their own draft (`denyMakerPublish`),
 * so the edit immediately preceding publish is genuinely the version a
 * Checker reviewed, not an arbitrary earlier one.
 */
export type ContentMetrics = {
  publishedThisMonth: number;
  /** Hours, or null when there weren't enough audit-log pairs this month to average. */
  avgApprovalHours: number | null;
};

type AuditRow = { collectionSlug?: string; documentId?: string; createdAt: string };

/**
 * `maxSamples` bounds the N+1 lookup this needs (one extra query per publish
 * row, to find its preceding edit) — a PoC-scale audit-log table doesn't
 * need it, but nothing here should degrade badly once one exists. The month
 * total itself (`publishedThisMonth`) is unaffected by the cap, since Payload
 * still returns the real `totalDocs` regardless of `limit`.
 */
export async function loadContentMetrics(payload: Payload, maxSamples = 50): Promise<ContentMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { docs, totalDocs: publishedThisMonth } = await payload.find({
    collection: "audit-logs",
    where: { and: [{ action: { equals: "publish" } }, { createdAt: { greater_than_equal: startOfMonth } }] },
    sort: "-createdAt",
    limit: maxSamples,
    depth: 0,
    overrideAccess: true,
  });

  const publishRows = (docs as unknown as AuditRow[]).filter((r) => r.collectionSlug && r.documentId);

  const gapsMs = await Promise.all(
    publishRows.map(async (row) => {
      const { docs: priorDocs } = await payload.find({
        collection: "audit-logs",
        where: {
          and: [
            { collectionSlug: { equals: row.collectionSlug } },
            { documentId: { equals: row.documentId } },
            { action: { in: ["create", "update"] } },
            { createdAt: { less_than: row.createdAt } },
          ],
        },
        sort: "-createdAt",
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const prior = priorDocs[0] as unknown as AuditRow | undefined;
      if (!prior) return null;
      return new Date(row.createdAt).getTime() - new Date(prior.createdAt).getTime();
    })
  );

  const validGapsMs = gapsMs.filter((ms): ms is number => ms !== null && ms >= 0);
  const avgApprovalHours = validGapsMs.length
    ? validGapsMs.reduce((sum, ms) => sum + ms, 0) / validGapsMs.length / (1000 * 60 * 60)
    : null;

  return { publishedThisMonth, avgApprovalHours };
}

/** "3.2 saat" under a day, "1g 4s" once it crosses 24h — both locales share the same shape, only the unit words differ. */
export function formatApprovalDuration(hours: number, locale: "tr" | "en"): string {
  if (hours < 24) {
    const rounded = Math.round(hours * 10) / 10;
    return locale === "tr" ? `${rounded} sa` : `${rounded}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return locale === "tr" ? `${days}g ${remainingHours}sa` : `${days}d ${remainingHours}h`;
}
