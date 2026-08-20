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
import { loadOwnDrafts, loadPendingCampaigns, type OwnDraft } from "@/lib/campaignApprovals";

type CollectionStat = {
  slug: string;
  label: string;
  total: number;
  published?: number;
  draft?: number;
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

const cardStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  minWidth: 180,
};

/**
 * Payload's built-in dashboard is just the collection group cards — it says
 * nothing about the actual state of the content. This adds a role-scoped
 * summary: Checkers get a straight-to-review queue, Makers get their own
 * in-flight drafts plus a pending-review count. Rendered directly inside
 * CustomDashboardView (not Payload's `beforeDashboard` slot — see that
 * file's comment for why).
 */
export default async function DashboardWidgets({
  payload,
  user,
  i18n,
}: {
  payload: Payload;
  user?: { id?: string | number; email?: string; role?: string };
  i18n: I18nClient;
}) {
  const locale: "tr" | "en" = i18n?.language === "en" ? "en" : "tr";
  const role = user?.role;
  const isNewVertical = role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.NEW_VERTICAL_CHECKER;
  // D1: both Checker roles review Campaigns (see the "campaigns" MATRIX
  // category in rolePermissions.ts — publish:true for both), so both get
  // the straight-to-review list, not just Growth Checker.
  const isCheckerRole = role === ROLES.NEW_VERTICAL_CHECKER || role === ROLES.GROWTH_CHECKER;
  const isMakerRole = role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.GROWTH_MAKER;
  const collectionSlugs = isNewVertical ? NEW_VERTICAL_DASHBOARD_COLLECTIONS : GROWTH_DASHBOARD_COLLECTIONS;

  const tt = await loadDbStrings(payload, locale);
  const t = {
    pendingTitle: tt("dashboardWidgets.pendingTitle"),
    pendingBody: (n: number) => applyPlaceholder(tt("dashboardWidgets.pendingBody"), n),
    reviewTitle: tt("dashboardWidgets.reviewTitle"),
    reviewEmpty: tt("dashboardWidgets.reviewEmpty"),
    reviewCta: tt("dashboardWidgets.reviewCta"),
    openedBy: tt("dashboardWidgets.openedBy"),
    ownDraftsTitle: tt("dashboardWidgets.ownDraftsTitle"),
    ownDraftsEmpty: tt("dashboardWidgets.ownDraftsEmpty"),
    ownDraftsPending: tt("dashboardWidgets.ownDraftsPending"),
    ownDraftsRejected: tt("dashboardWidgets.ownDraftsRejected"),
    editCta: tt("dashboardWidgets.editCta"),
  };

  // RFP feedback 2.4 / D1: a Checker's only real job on this dashboard is
  // "is there something to approve" — the generic content-summary cards
  // added nothing actionable. Straight-to-review list instead of stat cards.
  if (isCheckerRole) {
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
      </div>
    );
  }

  const stats = await loadCollectionStats(payload, collectionSlugs, locale);

  const totalDrafts = stats.reduce((sum, s) => sum + (s.draft ?? 0), 0);

  // D1: a Maker's own in-flight Campaigns drafts — pending review or sent
  // back rejected — surfaced directly instead of making them dig through
  // the Campaigns list to find what needs a resubmit.
  const ownDrafts: OwnDraft[] = isMakerRole && user?.id ? await loadOwnDrafts(payload, user.id) : [];
  const ownDraftsWidget = isMakerRole ? (
    <>
      <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{t.ownDraftsTitle}</p>
      <div className="card" style={{ padding: "0.5rem 0", maxWidth: 640, marginBottom: "1.5rem" }}>
        {ownDrafts.length === 0 ? (
          <p style={{ margin: "0.5rem 1rem", color: "var(--theme-elevation-500)", fontSize: "0.875rem" }}>{t.ownDraftsEmpty}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <tbody>
              {ownDrafts.map((d) => (
                <tr key={d.id}>
                  <td style={{ padding: "0.5rem 1rem" }}>{d.title}</td>
                  <td style={{ padding: "0.5rem 1rem", color: d.reviewStatus === "rejected" ? "var(--vf-red)" : "var(--theme-elevation-500)" }}>
                    {d.reviewStatus === "rejected" ? t.ownDraftsRejected : t.ownDraftsPending}
                  </td>
                  <td style={{ padding: "0.5rem 1rem", textAlign: "right" }}>
                    <a href={`/admin/collections/campaigns/${d.id}`} style={{ color: "var(--vf-red)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {t.editCta}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  ) : null;

  return (
    <div style={{ margin: "0 0 1rem" }}>
      {ownDraftsWidget}
      {totalDrafts > 0 && (
        <div
          className="card"
          style={{ ...cardStyle, marginBottom: "1rem", borderColor: "var(--vf-red)", maxWidth: 420 }}
        >
          <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{t.pendingTitle}</p>
          <p style={{ margin: 0, color: "var(--theme-elevation-500)", fontSize: "0.875rem" }}>{t.pendingBody(totalDrafts)}</p>
        </div>
      )}
    </div>
  );
}
