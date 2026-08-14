import type { CSSProperties } from "react";
import type { Payload } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { ROLES } from "@/access/roles";
import {
  COLLECTION_LABELS,
  DRAFT_ENABLED_COLLECTIONS,
  NEW_VERTICAL_DASHBOARD_COLLECTIONS,
  GROWTH_DASHBOARD_COLLECTIONS,
} from "@/lib/collectionLabels";
import { loadDbStrings } from "@/lib/loadDbStrings";
import { applyPlaceholder } from "@/lib/translationDefaults";

type CollectionStat = {
  slug: string;
  label: string;
  total: number;
  published?: number;
  draft?: number;
};

type LoginEntry = {
  userEmail: string;
  userRole?: string;
  createdAt: string;
  ip?: string;
};

const ROLE_LABELS: Record<string, { tr: string; en: string }> = {
  [ROLES.NEW_VERTICAL_MAKER]: { tr: "New Vertical — Maker", en: "New Vertical — Maker" },
  [ROLES.NEW_VERTICAL_CHECKER]: { tr: "New Vertical — Checker", en: "New Vertical — Checker" },
  [ROLES.GROWTH_MAKER]: { tr: "Growth — Maker", en: "Growth — Maker" },
  [ROLES.GROWTH_CHECKER]: { tr: "Growth — Checker", en: "Growth — Checker" },
};

async function loadCollectionStats(payload: Payload, slugs: string[], locale: "tr" | "en"): Promise<CollectionStat[]> {
  const stats = await Promise.all(
    slugs.map(async (slug): Promise<CollectionStat> => {
      const label = COLLECTION_LABELS[slug]?.[locale] ?? slug;
      if (!DRAFT_ENABLED_COLLECTIONS.has(slug)) {
        const { totalDocs } = await payload.count({ collection: slug as never, overrideAccess: true });
        return { slug, label, total: totalDocs };
      }
      const [publishedRes, draftRes] = await Promise.all([
        payload.count({
          collection: slug as never,
          where: { _status: { equals: "published" } },
          overrideAccess: true,
        }),
        payload.count({
          collection: slug as never,
          where: { _status: { equals: "draft" } },
          overrideAccess: true,
        }),
      ]);
      return {
        slug,
        label,
        total: publishedRes.totalDocs + draftRes.totalDocs,
        published: publishedRes.totalDocs,
        draft: draftRes.totalDocs,
      };
    })
  );
  return stats;
}

type PendingCampaign = { id: string | number; title: string; createdByEmail?: string };

async function loadPendingCampaigns(payload: Payload): Promise<PendingCampaign[]> {
  // See the identical comment in WaitingApprovalsView.tsx's loadPending —
  // `findVersions` (not `find`, even with `draft: true`) is required both
  // to avoid `denyUnauthenticatedDraftRead` blocking this unauthenticated
  // Local API call, and to see a Maker's plain draft resubmission (the base
  // "campaigns" table only reflects the latest PUBLISH).
  const { docs } = await payload.findVersions({
    collection: "campaigns",
    where: { and: [{ latest: { equals: true } }, { "version._status": { equals: "draft" } }] },
    sort: "-updatedAt",
    limit: 20,
    // RFP feedback 3.8: "hangi user bu talebi açmış altında yazsın" —
    // depth: 1 populates `createdBy` (a relationship) instead of just its id.
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

async function loadRecentLogins(payload: Payload): Promise<LoginEntry[]> {
  const { docs } = await payload.find({
    collection: "audit-logs",
    where: { action: { equals: "login" } },
    sort: "-createdAt",
    limit: 8,
    depth: 0,
    overrideAccess: true,
  });
  return docs as unknown as LoginEntry[];
}

/**
 * RFP feedback 3.6: "kaç farklı user var login'den bunu tutabilir" — distinct
 * count derived from who has actually logged in (not just the Users
 * collection's row count), matching the literal request.
 */
async function loadDistinctLoginUserCount(payload: Payload): Promise<number> {
  const { docs } = await payload.find({
    collection: "audit-logs",
    where: { action: { equals: "login" } },
    limit: 500,
    depth: 0,
    select: { userEmail: true },
    overrideAccess: true,
  });
  const emails = new Set((docs as unknown as { userEmail?: string }[]).map((d) => d.userEmail).filter(Boolean));
  return emails.size;
}

const cardStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  minWidth: 180,
};

const gridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  margin: "0.5rem 0 1.5rem",
};

/**
 * Payload's built-in dashboard is just the collection group cards — it says
 * nothing about the actual state of the content. This adds a role-scoped
 * summary (per-collection published/taslak counts) plus, for the one role
 * that can already read Audit Logs (New Vertical Maker), a recent-logins
 * table — reusing data/access rules that already exist rather than
 * exposing anything new. Server Component: runs on the admin server, gets
 * `payload`/`user`/`i18n` directly from Payload's `beforeDashboard` slot.
 */
export default async function DashboardWidgets({
  payload,
  user,
  i18n,
}: {
  payload: Payload;
  user?: { email?: string; role?: string };
  i18n: I18nClient;
}) {
  const locale: "tr" | "en" = i18n?.language === "en" ? "en" : "tr";
  const role = user?.role;
  const isNewVertical = role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.NEW_VERTICAL_CHECKER;
  const isGrowthChecker = role === ROLES.GROWTH_CHECKER;
  const collectionSlugs = isNewVertical ? NEW_VERTICAL_DASHBOARD_COLLECTIONS : GROWTH_DASHBOARD_COLLECTIONS;

  const tt = await loadDbStrings(payload, locale);
  const t = {
    summaryTitle: tt("dashboardWidgets.summaryTitle"),
    pendingTitle: tt("dashboardWidgets.pendingTitle"),
    pendingBody: (n: number) => applyPlaceholder(tt("dashboardWidgets.pendingBody"), n),
    published: tt("dashboardWidgets.published"),
    draft: tt("dashboardWidgets.draft"),
    total: tt("dashboardWidgets.total"),
    loginsTitle: tt("dashboardWidgets.loginsTitle"),
    noLogins: tt("dashboardWidgets.noLogins"),
    reviewTitle: tt("dashboardWidgets.reviewTitle"),
    reviewEmpty: tt("dashboardWidgets.reviewEmpty"),
    reviewCta: tt("dashboardWidgets.reviewCta"),
    openedBy: tt("dashboardWidgets.openedBy"),
    ip: tt("dashboardWidgets.ip"),
    distinctUsers: tt("dashboardWidgets.distinctUsers"),
  };

  // RFP feedback 3.6/3.7: "her kullanıcı için" — recent logins (with IP) are
  // no longer New Vertical Maker-only; every role sees who's been logging
  // in. Distinct-login-user-count is a small metric alongside it.
  const [logins, distinctUsers] = await Promise.all([loadRecentLogins(payload), loadDistinctLoginUserCount(payload)]);
  const loginsWidget = (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", margin: "0 0 0.25rem" }}>
        <p style={{ fontWeight: 600, margin: 0 }}>{t.loginsTitle}</p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--theme-elevation-450)" }}>
          ({distinctUsers} {t.distinctUsers})
        </p>
      </div>
      <div className="card" style={{ padding: "0.5rem 0", maxWidth: 640, marginBottom: "1.5rem" }}>
        {logins.length === 0 ? (
          <p style={{ margin: "0.5rem 1rem", color: "var(--theme-elevation-500)", fontSize: "0.875rem" }}>{t.noLogins}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <tbody>
              {logins.map((entry, i) => (
                <tr key={i}>
                  <td style={{ padding: "0.35rem 1rem" }}>{entry.userEmail}</td>
                  <td style={{ padding: "0.35rem 1rem", color: "var(--theme-elevation-500)" }}>
                    {entry.userRole ? ROLE_LABELS[entry.userRole]?.[locale] ?? entry.userRole : ""}
                  </td>
                  <td style={{ padding: "0.35rem 1rem", color: "var(--theme-elevation-500)", whiteSpace: "nowrap" }}>
                    {new Date(entry.createdAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}
                  </td>
                  <td style={{ padding: "0.35rem 1rem", color: "var(--theme-elevation-500)", whiteSpace: "nowrap" }}>{entry.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  // RFP feedback 2.4: Growth Checker's only real job on this dashboard is
  // "is there something to approve" — the generic content-summary cards
  // (which, for Growth, only ever contain the single Campaigns card anyway)
  // added nothing actionable. Straight-to-review list instead of stat cards.
  if (isGrowthChecker) {
    const pending = await loadPendingCampaigns(payload);
    return (
      <div style={{ margin: "0 0 1.5rem" }}>
        <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{t.reviewTitle}</p>
        <div className="card" style={{ padding: "0.5rem 0", maxWidth: 640, marginBottom: "1.5rem" }}>
          {pending.length === 0 ? (
            <p style={{ margin: "0.5rem 1rem", color: "var(--theme-elevation-500)", fontSize: "0.875rem" }}>{t.reviewEmpty}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: "0.5rem 1rem" }}>{p.title}</td>
                    <td style={{ padding: "0.5rem 1rem", color: "var(--theme-elevation-500)" }}>
                      {p.createdByEmail ? `${t.openedBy}: ${p.createdByEmail}` : ""}
                    </td>
                    <td style={{ padding: "0.5rem 1rem", textAlign: "right" }}>
                      <a href={`/admin/collections/campaigns/${p.id}`} style={{ color: "var(--vf-red)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {t.reviewCta}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {loginsWidget}
      </div>
    );
  }

  const stats = await loadCollectionStats(payload, collectionSlugs, locale);

  const totalDrafts = stats.reduce((sum, s) => sum + (s.draft ?? 0), 0);

  return (
    <div style={{ margin: "0 0 1rem" }}>
      {totalDrafts > 0 && (
        <div
          className="card"
          style={{ ...cardStyle, marginBottom: "1rem", borderColor: "var(--vf-red)", maxWidth: 420 }}
        >
          <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{t.pendingTitle}</p>
          <p style={{ margin: 0, color: "var(--theme-elevation-500)", fontSize: "0.875rem" }}>{t.pendingBody(totalDrafts)}</p>
        </div>
      )}

      <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{t.summaryTitle}</p>
      <div style={gridStyle}>
        {stats.map((s) => (
          <div key={s.slug} className="card" style={cardStyle}>
            <p style={{ fontWeight: 600, margin: "0 0 0.4rem" }}>{s.label}</p>
            {s.draft !== undefined ? (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--theme-elevation-500)" }}>
                {s.published} {t.published} · {s.draft} {t.draft}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--theme-elevation-500)" }}>
                {s.total} {t.total}
              </p>
            )}
          </div>
        ))}
      </div>

      {loginsWidget}
    </div>
  );
}
