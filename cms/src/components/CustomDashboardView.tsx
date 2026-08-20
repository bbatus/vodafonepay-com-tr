import Link from "next/link";
import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { loadDbStrings } from "@/lib/loadDbStrings";
import { COLLECTION_LABELS } from "@/lib/collectionLabels";
import DashboardWidgets from "./DashboardWidgets";

/**
 * RFP follow-up: "her rolün dashboard'unda bunlar olmalı... şu an olan her
 * şeyi kaldır, collectionlar falan gözükmesin" — a real reference dashboard
 * screenshot (stat cards, content distribution, pending approvals, recent
 * logins, recent items per collection) was compared against ours. Payload's
 * OWN default dashboard body is just a grid of every collection/group as a
 * link card — it says nothing about the actual state of content, and it's
 * exactly the "koleksiyonlar gözüksün" look the feedback rejected.
 *
 * `admin.components.beforeDashboard` (the previous wiring) only PREPENDS
 * content above that default grid — it can't remove it. `views.dashboard`
 * (this file) is the actual full-replacement extension point: registering
 * it here means Payload never renders its own dashboard body at all, only
 * whatever this component returns.
 *
 * Unlike ContentManagementView/FeesAndLimitsView (brand-new view keys that
 * Payload's Root view does NOT wrap), `dashboard` is a recognized built-in
 * view type — Root already wraps it in DefaultTemplate before rendering
 * this component (see @payloadcms/next/dist/views/Root/index.js,
 * `templateType === 'default'`). Wrapping it AGAIN here produced a nested
 * sidebar/topbar (found live — two full nav rails stacked). So this
 * component returns bare content only, no DefaultTemplate of its own.
 *
 * This composes three layers, each already role-aware or newly added:
 * 1. A KPI row (NEW) — the "at a glance" numbers the reference dashboard
 *    leads with, not previously shown anywhere.
 * 2. `DashboardWidgets` (UNCHANGED, just relocated here from
 *    beforeDashboard) — the pending-review / own-drafts / per-collection
 *    published+draft stats / recent-logins sections already built and
 *    already role-scoped (Checker sees a review queue, Maker sees their
 *    own drafts, both see stats+logins).
 * 3. Recent-items panels (NEW) — "Son Kampanyalar"/"Son Bloglar"/"Sayfalar"
 *    style lists the reference dashboard has and ours didn't, each linking
 *    straight to the real document.
 */

type RecentDoc = { id: string | number; title?: string; question?: string; updatedAt: string; _status?: string };

async function loadRecent(payload: Payload, collection: string, titleField: string, limit = 5): Promise<RecentDoc[]> {
  const { docs } = await payload.find({
    collection: collection as never,
    sort: "-updatedAt",
    limit,
    depth: 0,
    overrideAccess: true,
  });
  return (docs as unknown as Record<string, unknown>[]).map((d) => ({
    id: d.id as string | number,
    title: (d[titleField] as string | undefined) ?? undefined,
    updatedAt: d.updatedAt as string,
    _status: d._status as string | undefined,
  }));
}

function RecentPanel({
  title,
  collection,
  docs,
  locale,
  statusLabels,
}: {
  title: string;
  collection: string;
  docs: RecentDoc[];
  locale: "tr" | "en";
  statusLabels: { published: string; draft: string };
}) {
  return (
    <div className="card cm-card" style={{ minWidth: 260, flex: "1 1 260px" }}>
      <p style={{ fontWeight: 600, margin: "0.75rem 1rem 0.5rem" }}>{title}</p>
      {docs.length === 0 ? (
        <p style={{ margin: "0.5rem 1rem 0.75rem", fontSize: "0.875rem", color: "var(--theme-elevation-500)" }}>
          {locale === "tr" ? "Kayıt yok." : "No records."}
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: "0 0 0.5rem" }}>
          {docs.map((d) => (
            <li key={d.id} style={{ padding: "0.35rem 1rem", display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
              <Link href={`/admin/collections/${collection}/${d.id}`} style={{ fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.title || `#${d.id}`}
              </Link>
              {d._status && (
                <span className={`cm-badge${d._status === "published" ? " cm-badge--published" : ""}`} style={{ flexShrink: 0 }}>
                  {d._status === "published" ? statusLabels.published : statusLabels.draft}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function CustomDashboardView(props: {
  payload: Payload;
  i18n: I18nClient;
  locale?: { code: string } | string;
  initPageResult?: {
    req?: PayloadRequest;
    permissions?: unknown;
    visibleEntities?: { collections?: string[]; globals?: string[] };
  };
}) {
  const { payload, i18n, initPageResult } = props;
  const user = (initPageResult?.req as PayloadRequest | undefined)?.user as
    | { id?: string | number; email?: string; role?: string }
    | undefined;
  const locale: "tr" | "en" = i18n?.language === "en" ? "en" : "tr";
  const t = await loadDbStrings(payload, locale);

  const kpiSlugs = ["campaigns", "blog-posts", "faq-items", "announcements", "representatives", "pages"] as const;
  const [kpiCounts, pageCount, userCount, faqCount, recentCampaigns, recentBlogPosts, recentPages] = await Promise.all([
    Promise.all(kpiSlugs.map((slug) => payload.count({ collection: slug as never, overrideAccess: true }).then((r) => r.totalDocs))),
    payload.count({ collection: "pages", overrideAccess: true }).then((r) => r.totalDocs),
    payload.count({ collection: "users", overrideAccess: true }).then((r) => r.totalDocs),
    payload.count({ collection: "faq-items", overrideAccess: true }).then((r) => r.totalDocs),
    loadRecent(payload, "campaigns", "title"),
    loadRecent(payload, "blog-posts", "title"),
    loadRecent(payload, "pages", "title"),
  ]);
  const totalContent = kpiCounts.reduce((sum, n) => sum + n, 0);

  const statusLabels = { published: t("contentManagement.published"), draft: t("contentManagement.draft") };

  const kpiCards = [
    { label: t("dashboardKpi.totalContent"), value: totalContent },
    { label: COLLECTION_LABELS["pages"]?.[locale] ?? "Sayfalar", value: pageCount },
    { label: COLLECTION_LABELS["users"]?.[locale] ?? "Kullanıcılar", value: userCount },
    { label: COLLECTION_LABELS["faq-items"]?.[locale] ?? "SSS", value: faqCount },
  ];

  return (
      <div className="cm" style={{ paddingBottom: "1.5rem" }}>
        <h1>{t("dashboardKpi.title")}</h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", margin: "1rem 0 1.5rem" }}>
          {kpiCards.map((c) => (
            <div key={c.label} className="card" style={{ padding: "1rem 1.5rem", minWidth: 160 }}>
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.8rem", color: "var(--theme-elevation-500)" }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {user ? <DashboardWidgets payload={payload} user={user} i18n={i18n} /> : null}

        <h2 className="cm-section-title">{t("dashboardKpi.recentTitle")}</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <RecentPanel
            title={COLLECTION_LABELS["campaigns"]?.[locale] ?? "Kampanyalar"}
            collection="campaigns"
            docs={recentCampaigns}
            locale={locale}
            statusLabels={statusLabels}
          />
          <RecentPanel
            title={COLLECTION_LABELS["blog-posts"]?.[locale] ?? "Bloglar"}
            collection="blog-posts"
            docs={recentBlogPosts}
            locale={locale}
            statusLabels={statusLabels}
          />
          <RecentPanel
            title={COLLECTION_LABELS["pages"]?.[locale] ?? "Sayfalar"}
            collection="pages"
            docs={recentPages}
            locale={locale}
            statusLabels={statusLabels}
          />
        </div>
      </div>
  );
}
