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
  const collectionSlugs = isNewVertical ? NEW_VERTICAL_DASHBOARD_COLLECTIONS : GROWTH_DASHBOARD_COLLECTIONS;

  const [stats, logins] = await Promise.all([
    loadCollectionStats(payload, collectionSlugs, locale),
    role === ROLES.NEW_VERTICAL_MAKER ? loadRecentLogins(payload) : Promise.resolve<LoginEntry[]>([]),
  ]);

  const totalDrafts = stats.reduce((sum, s) => sum + (s.draft ?? 0), 0);

  const t = {
    summaryTitle: locale === "tr" ? "İçerik Özeti" : "Content Summary",
    pendingTitle: locale === "tr" ? "Onay Bekleyen Taslaklar" : "Pending Drafts",
    pendingBody:
      locale === "tr"
        ? `Toplam ${totalDrafts} taslak henüz yayınlanmadı.`
        : `${totalDrafts} draft(s) not yet published.`,
    published: locale === "tr" ? "yayında" : "published",
    draft: locale === "tr" ? "taslak" : "draft",
    total: locale === "tr" ? "kayıt" : "records",
    loginsTitle: locale === "tr" ? "Son Giriş Yapanlar" : "Recent Logins",
    noLogins: locale === "tr" ? "Henüz giriş kaydı yok." : "No login records yet.",
  };

  return (
    <div style={{ margin: "0 0 1rem" }}>
      {totalDrafts > 0 && (
        <div
          className="card"
          style={{ ...cardStyle, marginBottom: "1rem", borderColor: "var(--vf-red)", maxWidth: 420 }}
        >
          <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{t.pendingTitle}</p>
          <p style={{ margin: 0, color: "var(--theme-elevation-500)", fontSize: "0.875rem" }}>{t.pendingBody}</p>
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

      {role === ROLES.NEW_VERTICAL_MAKER && (
        <>
          <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{t.loginsTitle}</p>
          <div className="card" style={{ padding: "0.5rem 0", maxWidth: 520, marginBottom: "1.5rem" }}>
            {logins.length === 0 ? (
              <p style={{ margin: "0.5rem 1rem", color: "var(--theme-elevation-500)", fontSize: "0.875rem" }}>
                {t.noLogins}
              </p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
