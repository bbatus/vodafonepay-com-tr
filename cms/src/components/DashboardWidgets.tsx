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
import { IconCheckCircle, IconDraft } from "./DashboardIcons";

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
      <div className="cm-widget">
        <p className="cm-widget__title">
          <IconCheckCircle />
          {t.reviewTitle}
        </p>
        <div className="card cm-widget__body">
          {pending.length === 0 ? (
            <p className="cm-widget__empty">{t.reviewEmpty}</p>
          ) : (
            <table className="cm-widget-table">
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.createdByEmail ? `${t.openedBy}: ${p.createdByEmail}` : ""}</td>
                    <td>
                      <a href={`/admin/collections/campaigns/${p.id}`}>{t.reviewCta}</a>
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
    <div className="cm-widget">
      <p className="cm-widget__title">
        <IconDraft />
        {t.ownDraftsTitle}
      </p>
      <div className="card cm-widget__body">
        {ownDrafts.length === 0 ? (
          <p className="cm-widget__empty">{t.ownDraftsEmpty}</p>
        ) : (
          <table className="cm-widget-table">
            <tbody>
              {ownDrafts.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td className={d.reviewStatus === "rejected" ? "cm-rejected" : undefined}>
                    {d.reviewStatus === "rejected" ? t.ownDraftsRejected : t.ownDraftsPending}
                  </td>
                  <td>
                    <a href={`/admin/collections/campaigns/${d.id}`}>{t.editCta}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="cm-dashboard-widgets">
      {ownDraftsWidget}
      {totalDrafts > 0 && (
        <div className="card cm-pending-banner">
          <IconCheckCircle />
          <div>
            <p className="cm-pending-banner__title">{t.pendingTitle}</p>
            <p className="cm-pending-banner__body">{t.pendingBody(totalDrafts)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
