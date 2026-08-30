import Link from "next/link";
import type { Payload, PayloadRequest } from "payload";
import type { I18nClient } from "@payloadcms/translations";
import { loadDbStrings } from "@/lib/loadDbStrings";
import { COLLECTION_LABELS } from "@/lib/collectionLabels";
import DashboardWidgets from "./DashboardWidgets";
import { countSiteUrls, loadSitePages, type SitePageEntry } from "@/lib/sitePages";
import { loadContentMetrics, formatApprovalDuration } from "@/lib/contentMetrics";
import { IconContent, IconPage, IconUsers, IconFaq, IconCampaign, IconBlog, IconClock, IconCheckCircle, IconPlus } from "./DashboardIcons";

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
 * Styling follow-up: "çok renkli olmasın, vodafone renklerinde olsun" —
 * moved off per-element inline styles onto the `.cm-kpi-*`/`.cm-panel-*`
 * classes in custom.css (matching the "no new inline styles in the CMS"
 * convention that section already documents), one red accent color
 * (`--vf-red`) instead of a different color per card, plus small inline SVG
 * icons (DashboardIcons.tsx) rather than a new icon-library dependency.
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
  icon,
  collection,
  docs,
  locale,
  statusLabels,
  addLabel,
  canCreate,
}: {
  title: string;
  icon: React.ReactNode;
  collection: string;
  docs: RecentDoc[];
  locale: "tr" | "en";
  statusLabels: { published: string; draft: string };
  addLabel: string;
  canCreate: boolean;
}) {
  return (
    <div className="card cm-card cm-panel">
      <div className="cm-panel__head">
        <p className="cm-panel__title">
          {icon}
          {title}
        </p>
        {/*
          Found live 29.08.2026 walking the panel as a Growth Checker. This
          link rendered for everyone, and a Checker has `create` permission
          nowhere by design — but the failure was not a 403 toast. Payload
          serves the create route to an unauthorized user as its "please log
          in" screen: "Bu işlemi gerçekleştirmek için lütfen giriş yapın / Bu
          sayfaya erişim izniniz yok", with a Çıkış button. So the panel told a
          logged-in reviewer they were not logged in, and offered to log them
          out, in answer to pressing a button it drew itself. Same rule as
          MakerAwarePublishButton and FeesAndLimitsApp's CreateButton: never
          offer a control the server will refuse.
        */}
        {canCreate && (
          <Link href={`/admin/collections/${collection}/create`} className="cm-panel__add">
            <IconPlus />
            {addLabel}
          </Link>
        )}
      </div>
      {docs.length === 0 ? (
        <p className="cm-panel__empty">{locale === "tr" ? "Kayıt yok." : "No records."}</p>
      ) : (
        <ul className="cm-panel__list">
          {docs.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/collections/${collection}/${d.id}`}>{d.title || `#${d.id}`}</Link>
              {d._status && (
                <span className={`cm-badge${d._status === "published" ? " cm-badge--published" : ""}`}>
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

function SitePagesPanel({
  entries,
  locale,
  siteBase,
}: {
  entries: SitePageEntry[];
  locale: "tr" | "en";
  siteBase: string;
}) {
  const sourceLabels: Record<SitePageEntry["source"], string> =
    locale === "tr"
      ? { static: "Sabit", cms: "CMS", dynamic: "Dinamik" }
      : { static: "Static", cms: "CMS", dynamic: "Dynamic" };

  return (
    <div className="table-wrap card cm-card">
      <table className="cm-table">
        <thead>
          <tr>
            <th>{locale === "tr" ? "Sayfa" : "Page"}</th>
            <th>{locale === "tr" ? "Adres" : "Path"}</th>
            <th>{locale === "tr" ? "Kaynak" : "Source"}</th>
            <th>{locale === "tr" ? "URL sayısı" : "URLs"}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.path}>
              <td>
                {e.editHref ? <Link href={e.editHref}>{e.title}</Link> : e.title}
              </td>
              <td>
                {e.source === "dynamic" ? (
                  <code>{e.path}</code>
                ) : (
                  <a href={`${siteBase}${e.path}`} target="_blank" rel="noopener noreferrer">
                    <code>{e.path}</code>
                  </a>
                )}
              </td>
              <td>
                <span className={`cm-badge${e.source === "cms" && !e.isDraft ? " cm-badge--published" : ""}`}>
                  {sourceLabels[e.source]}
                </span>
                {e.isDraft && <span className="cm-badge">{locale === "tr" ? "Taslak" : "Draft"}</span>}
              </td>
              <td>{e.urlCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const [kpiCounts, sitePages, userCount, faqCount, recentCampaigns, recentBlogPosts, recentPages, contentMetrics] = await Promise.all([
    Promise.all(kpiSlugs.map((slug) => payload.count({ collection: slug as never, overrideAccess: true }).then((r) => r.totalDocs))),
    loadSitePages(payload, locale),
    payload.count({ collection: "users", overrideAccess: true }).then((r) => r.totalDocs),
    payload.count({ collection: "faq-items", overrideAccess: true }).then((r) => r.totalDocs),
    loadRecent(payload, "campaigns", "title"),
    loadRecent(payload, "blog-posts", "title"),
    loadRecent(payload, "pages", "title"),
    loadContentMetrics(payload),
  ]);
  const totalContent = kpiCounts.reduce((sum, n) => sum + n, 0);
  const siteUrlCount = countSiteUrls(sitePages);

  const siteBase = process.env.SITE_URL || "http://localhost:3000";
  const statusLabels = { published: t("contentManagement.published"), draft: t("contentManagement.draft") };
  const addLabel = locale === "tr" ? "Yeni" : "New";
  // Payload hands the view its own sanitized permission set; this is the
  // server-side twin of `useAuth().permissions` that FeesAndLimitsApp checks.
  const permissions = initPageResult?.permissions as
    | { collections?: Record<string, { create?: unknown } | undefined> }
    | undefined;
  const canCreate = (slug: string) => Boolean(permissions?.collections?.[slug]?.create);

  const kpiCards = [
    { label: t("dashboardKpi.totalContent"), value: totalContent, icon: <IconContent /> },
    { label: locale === "tr" ? "Sayfalar" : "Pages", value: siteUrlCount, icon: <IconPage /> },
    { label: COLLECTION_LABELS["users"]?.[locale] ?? "Kullanıcılar", value: userCount, icon: <IconUsers /> },
    { label: COLLECTION_LABELS["faq-items"]?.[locale] ?? "SSS", value: faqCount, icon: <IconFaq /> },
    { label: t("dashboardKpi.publishedThisMonth"), value: contentMetrics.publishedThisMonth, icon: <IconCheckCircle /> },
    {
      label: t("dashboardKpi.avgApprovalTime"),
      value:
        contentMetrics.avgApprovalHours === null
          ? t("dashboardKpi.avgApprovalTimeEmpty")
          : formatApprovalDuration(contentMetrics.avgApprovalHours, locale),
      icon: <IconClock />,
    },
  ];

  return (
    <div className="cm cm--dashboard">
      <h1>{t("dashboardKpi.title")}</h1>

      <div className="cm-kpi-row">
        {kpiCards.map((c) => (
          <div key={c.label} className="card cm-kpi-card">
            <span className="cm-kpi-card__icon">{c.icon}</span>
            <div>
              <p className="cm-kpi-card__label">{c.label}</p>
              <p className="cm-kpi-card__value">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {user ? <DashboardWidgets payload={payload} user={user} i18n={i18n} /> : null}

      <h2 className="cm-section-title cm-section-title--icon">
        <IconClock />
        {t("dashboardKpi.recentTitle")}
      </h2>
      <div className="cm-panel-row">
        <RecentPanel
          title={COLLECTION_LABELS["campaigns"]?.[locale] ?? "Kampanyalar"}
          icon={<IconCampaign />}
          collection="campaigns"
          canCreate={canCreate("campaigns")}
          docs={recentCampaigns}
          locale={locale}
          statusLabels={statusLabels}
          addLabel={addLabel}
        />
        <RecentPanel
          title={COLLECTION_LABELS["blog-posts"]?.[locale] ?? "Bloglar"}
          icon={<IconBlog />}
          collection="blog-posts"
          canCreate={canCreate("blog-posts")}
          docs={recentBlogPosts}
          locale={locale}
          statusLabels={statusLabels}
          addLabel={addLabel}
        />
        <RecentPanel
          title={COLLECTION_LABELS["pages"]?.[locale] ?? "Sayfalar"}
          icon={<IconPage />}
          collection="pages"
          canCreate={canCreate("pages")}
          docs={recentPages}
          locale={locale}
          statusLabels={statusLabels}
          addLabel={addLabel}
        />
      </div>

      <h2 className="cm-section-title cm-section-title--icon">
        <IconPage />
        {locale === "tr" ? "Site Sayfaları" : "Site Pages"}
      </h2>
      <p className="cm-hint">
        {locale === "tr"
          ? "Sitenin yayınladığı tüm adresler. \"Sabit\" satırlar geliştirici tarafından yazılmış sayfalardır (CMS'ten düzenlenemez), \"CMS\" satırları Sayfalar koleksiyonundan düzenlenebilir, \"Dinamik\" satırlar ise her kayıt için ayrı bir adres üretir."
          : "Every address the site publishes. \"Static\" rows are developer-built pages (not editable in the CMS), \"CMS\" rows are editable from the Pages collection, and \"Dynamic\" rows produce one address per record."}
      </p>
      <SitePagesPanel entries={sitePages} locale={locale} siteBase={siteBase} />
    </div>
  );
}
