import type { Payload } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { ROLES, hasActiveCheckerDelegate } from "@/access/roles";
import {
  COLLECTION_LABELS,
  DRAFT_ENABLED_COLLECTIONS,
  NEW_VERTICAL_DASHBOARD_COLLECTIONS,
  GROWTH_DASHBOARD_COLLECTIONS,
} from "@/lib/collectionLabels";
import { loadDbStrings } from "@/lib/loadDbStrings";
import { applyPlaceholder } from "@/lib/translationDefaults";
import { loadOwnDrafts, loadPendingCampaigns, type OwnDraft } from "@/lib/campaignApprovals";
import { IconCheckCircle, IconDraft, IconUsers } from "./DashboardIcons";

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
  //
  // RFP §3.1 delegation: a maker/checker temporarily standing in for an
  // absent checker (see hasActiveCheckerDelegate) sees the SAME review
  // queue a real checker would — otherwise they'd have publish rights
  // (denyRolePublish already lets them through) with no dashboard signal
  // telling them there's anything to review.
  const isActiveDelegate = user?.id != null && (await hasActiveCheckerDelegate(payload, user.id));
  const isCheckerRole = role === ROLES.NEW_VERTICAL_CHECKER || role === ROLES.GROWTH_CHECKER || isActiveDelegate;
  const isMakerRole = (role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.GROWTH_MAKER) && !isActiveDelegate;
  const collectionSlugs = isNewVertical ? NEW_VERTICAL_DASHBOARD_COLLECTIONS : GROWTH_DASHBOARD_COLLECTIONS;

  const tt = await loadDbStrings(payload, locale);
  const t = {
    pendingTitle: tt("dashboardWidgets.pendingTitle"),
    pendingBody: (n: number) => applyPlaceholder(tt("dashboardWidgets.pendingBody"), n),
    reviewTitle: tt("dashboardWidgets.reviewTitle"),
    reviewEmpty: tt("dashboardWidgets.reviewEmpty"),
    reviewCta: tt("dashboardWidgets.reviewCta"),
    openedBy: tt("dashboardWidgets.openedBy"),
    loginsTitle: tt("dashboardWidgets.loginsTitle"),
    noLogins: tt("dashboardWidgets.noLogins"),
    distinctUsers: tt("dashboardWidgets.distinctUsers"),
    ownDraftsTitle: tt("dashboardWidgets.ownDraftsTitle"),
    ownDraftsEmpty: tt("dashboardWidgets.ownDraftsEmpty"),
    ownDraftsPending: tt("dashboardWidgets.ownDraftsPending"),
    ownDraftsRejected: tt("dashboardWidgets.ownDraftsRejected"),
    editCta: tt("dashboardWidgets.editCta"),
  };

  // RFP feedback 3.6/3.7: "her kullanıcı için" — recent logins (with IP) are
  // not role-restricted; every role sees who's been logging in.
  const [logins, distinctUsers] = await Promise.all([loadRecentLogins(payload), loadDistinctLoginUserCount(payload)]);
  const loginsWidget = (
    <div className="cm-widget">
      <p className="cm-widget__title">
        <IconUsers />
        {t.loginsTitle}
        <span className="cm-widget__title-sub">
          ({distinctUsers} {t.distinctUsers})
        </span>
      </p>
      <div className="card cm-widget__body">
        {logins.length === 0 ? (
          <p className="cm-widget__empty">{t.noLogins}</p>
        ) : (
          <table className="cm-widget-table">
            <tbody>
              {logins.map((entry) => (
                <tr key={`${entry.userEmail}-${entry.createdAt}`}>
                  <td>{entry.userEmail}</td>
                  <td>{entry.userRole ? ROLE_LABELS[entry.userRole]?.[locale] ?? entry.userRole : ""}</td>
                  <td>{new Date(entry.createdAt).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}</td>
                  <td>{entry.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // RFP feedback 2.4 / D1: a Checker's only real job on this dashboard is
  // "is there something to approve" — the generic content-summary cards
  // added nothing actionable. Straight-to-review list instead of stat cards.
  if (isCheckerRole) {
    const pending = await loadPendingCampaigns(payload);
    return (
      <div className="cm-dashboard-widgets">
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
        {loginsWidget}
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
      {loginsWidget}
    </div>
  );
}
