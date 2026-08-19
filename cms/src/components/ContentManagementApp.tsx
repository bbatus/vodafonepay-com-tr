"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import {
  ALL_REPORTED_SLUGS,
  HAND_BUILT_ROUTES,
  REPORT_COLLECTIONS,
  SITE_ROUTES_TAB_SLUG,
  hasDrafts,
  tabLabel,
  type ReportColumn,
} from "@/lib/contentManagementTabs";
import { describeApiError } from "@/lib/apiErrorMessage";

type Doc = { id: string | number; [key: string]: unknown };

type Summary = {
  slug: string;
  /** null = this role has no read access to the collection. */
  total: number | null;
  published?: number;
  draft?: number;
  lastUpdated?: string;
};

const PAGE_SIZE = 10;

/** Unknown-typed CMS field values may be objects (rich text, unpopulated relations); avoid "[object Object]". */
function safeString(value: unknown): string {
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value as string | number | boolean | undefined);
}

/**
 * RFP feedback 5.9 — a READ-ONLY report over the whole CMS.
 *
 * Every role can open this page; no role can change anything from it. The
 * previous version was a hand-rolled CRUD surface (Yeni Ekle / Düzenle / Sil /
 * Seçilenleri Sil) sitting beside Payload's own list views, which meant two
 * separate places to keep in step and two places a delete could happen. Rows
 * now link out to Payload's document view, where the real access rules already
 * live.
 *
 * Access is Payload's, unchanged: every request is a plain REST call carrying
 * the browser's session cookie, never `overrideAccess`. A collection this role
 * can't read reports as inaccessible rather than showing a count it shouldn't
 * know — which is why `total` is nullable instead of defaulting to 0.
 */
export default function ContentManagementApp() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  const [summaries, setSummaries] = useState<Summary[] | null>(null);
  const [activeSlug, setActiveSlug] = useState(REPORT_COLLECTIONS[0].slug);
  const isSiteRoutesTab = activeSlug === SITE_ROUTES_TAB_SLUG;
  const tab = useMemo(() => REPORT_COLLECTIONS.find((c) => c.slug === activeSlug), [activeSlug]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- summary across every collection -------------------------------------
  useEffect(() => {
    let cancelled = false;

    const countOf = async (slug: string, extra?: Record<string, string>): Promise<number | null> => {
      const params = new URLSearchParams({ limit: "0", depth: "0", ...extra });
      const res = await fetch(`/api/${slug}?${params.toString()}`, { credentials: "same-origin" });
      if (!res.ok) return null;
      const data = (await res.json()) as { totalDocs?: number };
      return data.totalDocs ?? 0;
    };

    Promise.all(
      ALL_REPORTED_SLUGS.map(async (slug): Promise<Summary> => {
        try {
          const total = await countOf(slug);
          if (total === null) return { slug, total: null };

          let published: number | undefined;
          let draft: number | undefined;
          if (hasDrafts(slug)) {
            const pub = await countOf(slug, { "where[_status][equals]": "published" });
            if (pub !== null) {
              published = pub;
              draft = total - pub;
            }
          }

          let lastUpdated: string | undefined;
          if (total > 0) {
            const res = await fetch(`/api/${slug}?limit=1&depth=0&sort=-updatedAt`, { credentials: "same-origin" });
            if (res.ok) {
              const data = (await res.json()) as { docs?: { updatedAt?: string }[] };
              lastUpdated = data.docs?.[0]?.updatedAt;
            }
          }
          return { slug, total, published, draft, lastUpdated };
        } catch {
          return { slug, total: null };
        }
      })
    ).then((rows) => {
      if (!cancelled) setSummaries(rows);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- detail list for the active tab --------------------------------------
  const load = useCallback(async () => {
    // The hand-built-routes tab isn't backed by a Payload collection — see
    // HAND_BUILT_ROUTES' own comment — so there's no API call to make here;
    // renderDetail() renders that static table directly instead.
    if (isSiteRoutesTab || !tab) {
      setDocs([]);
      setTotalPages(1);
      setTotalDocs(HAND_BUILT_ROUTES.length);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      page: String(page),
      depth: String(tab.depth ?? 0),
      sort: "-updatedAt",
    });
    if (search.trim()) params.set(`where[${tab.titleField}][contains]`, search.trim());

    try {
      const res = await fetch(`/api/${tab.slug}?${params.toString()}`, { credentials: "same-origin" });
      if (!res.ok) {
        // 403 keeps its own dedicated copy ("bu koleksiyona erişimin yok")
        // since that's an expected, frequent case for this read-only report —
        // anything else (500, network) gets the real reason instead of the
        // same "no access" text, which would misdirect an editor troubleshooting it.
        if (res.status === 403) throw new Error(t("contentManagement.noAccess"));
        const body = await res.json().catch(() => null);
        throw new Error(describeApiError({ status: res.status, body, locale, context: "generic" }));
      }
      const data = await res.json();
      setDocs(data.docs ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalDocs(data.totalDocs ?? 0);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("contentManagement.noAccess"));
      setDocs([]);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, t, locale, isSiteRoutesTab]);

  useEffect(() => {
  // startTransition keeps the first setState out of the effect's synchronous
  // body (react-hooks/set-state-in-effect) — a plain `void load()` here
  // triggers a cascading render on every dependency change.
    startTransition(() => {
      void load();
    });
  }, [load]);

  const switchTab = (slug: string) => {
    setActiveSlug(slug);
    setSearch("");
    setPage(1);
  };

  const renderCell = (doc: Doc, column: ReportColumn) => {
    const value = doc[column.key];
    if (value === null || value === undefined || value === "") return "—";
    // A `select` field's stored value ("pending", "step") is a database token,
    // not something to show a reader in either language.
    if (column.values && typeof value === "string" && column.values[value]) {
      return column.values[value][locale];
    }
    switch (column.type) {
      case "date":
        return new Date(safeString(value)).toLocaleDateString(dateLocale);
      case "bool":
        return value ? t("contentManagement.yes") : t("contentManagement.no");
      case "status":
        return (
          <span className={`cm-badge${value === "published" ? " cm-badge--published" : ""}`}>
            {value === "published" ? t("contentManagement.published") : t("contentManagement.draft")}
          </span>
        );
      case "relation": {
        // depth:1 populates these; fall back to the raw id if it didn't.
        if (typeof value === "object") {
          const rel = value as { label?: string; title?: string; email?: string; id?: string | number };
          return rel.label ?? rel.title ?? rel.email ?? String(rel.id ?? "—");
        }
        return safeString(value);
      }
      default:
        return safeString(value);
    }
  };

  const titleOf = (doc: Doc): string => {
    const value = tab ? doc[tab.titleField] : undefined;
    return typeof value === "string" && value ? value : `#${String(doc.id)}`;
  };

  const renderSiteRoutesDetail = () => (
    <div className="table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>{t("contentManagement.colTitle")}</th>
            <th>{t("contentManagement.colPath")}</th>
            <th>{t("contentManagement.colLinkedFrom")}</th>
          </tr>
        </thead>
        <tbody>
          {HAND_BUILT_ROUTES.filter(
            (r) => !search.trim() || r.title.toLowerCase().includes(search.trim().toLowerCase()) || r.path.includes(search.trim())
          ).map((r) => (
            <tr key={r.path}>
              <td>{r.title}</td>
              <td>
                <code>{r.path}</code>
              </td>
              <td>{r.linkedFrom[locale]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDetail = () => {
    if (isSiteRoutesTab) return renderSiteRoutesDetail();
    if (!tab) return null;
    if (loading) return <p className="cm-hint">{t("contentManagement.loading")}</p>;
    if (error) return <p className="cm-error">{error}</p>;
    if (docs.length === 0) return <p className="cm-hint">{t("contentManagement.empty")}</p>;
    return (
      <div className="table-wrap">
        <table className="cm-table">
          <thead>
            <tr>
              <th>{t("contentManagement.colTitle")}</th>
              {tab.columns.map((c) => (
                <th key={c.key}>{c.label[locale]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={String(doc.id)}>
                <td>
                  <Link href={`/admin/collections/${tab.slug}/${String(doc.id)}`}>{titleOf(doc)}</Link>
                </td>
                {tab.columns.map((c) => (
                  <td key={c.key}>{renderCell(doc, c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSummary = () => {
    if (summaries === null) return <p className="cm-hint">{t("contentManagement.loading")}</p>;
    return (
      <div className="table-wrap">
        <table className="cm-table">
          <thead>
            <tr>
              <th>{t("contentManagement.colCollection")}</th>
              <th>{t("contentManagement.colTotal")}</th>
              <th>{t("contentManagement.published")}</th>
              <th>{t("contentManagement.draft")}</th>
              <th>{t("contentManagement.colUpdated")}</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.slug}>
                <td>
                  <Link href={`/admin/collections/${s.slug}`}>{tabLabel(s.slug, locale)}</Link>
                </td>
                {s.total === null ? (
                  <td colSpan={4} className="cm-muted">
                    {t("contentManagement.noAccess")}
                  </td>
                ) : (
                  <>
                    <td>{s.total}</td>
                    <td>{s.published ?? "—"}</td>
                    <td>{s.draft ?? "—"}</td>
                    <td>{s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString(dateLocale) : "—"}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="cm">
      <h1>{t("contentManagement.title")}</h1>
      <p className="cm-hint">{t("contentManagement.readOnlyNote")}</p>

      <h2 className="cm-section-title">{t("contentManagement.summaryTitle")}</h2>
      {renderSummary()}

      <h2 className="cm-section-title">{t("contentManagement.detailTitle")}</h2>
      <div className="cm-tabs">
        {REPORT_COLLECTIONS.map((c) => (
          <button
            key={c.slug}
            type="button"
            className={`cm-tab${c.slug === activeSlug ? " cm-tab--active" : ""}`}
            aria-pressed={c.slug === activeSlug}
            onClick={() => switchTab(c.slug)}
          >
            {tabLabel(c.slug, locale)}
          </button>
        ))}
        <button
          type="button"
          className={`cm-tab${isSiteRoutesTab ? " cm-tab--active" : ""}`}
          aria-pressed={isSiteRoutesTab}
          onClick={() => switchTab(SITE_ROUTES_TAB_SLUG)}
        >
          {tabLabel(SITE_ROUTES_TAB_SLUG, locale)}
        </button>
      </div>
      {isSiteRoutesTab && <p className="cm-hint">{t("contentManagement.siteRoutesHint")}</p>}

      <div className="cm-toolbar">
        <input
          type="text"
          className="cm-search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t("contentManagement.searchPlaceholder")}
          aria-label={t("contentManagement.searchPlaceholder")}
        />
        <span className="cm-muted">
          {totalDocs} {t("contentManagement.recordCount")}
        </span>
      </div>

      <div className="card cm-card">{renderDetail()}</div>

      {totalPages > 1 && (
        <div className="cm-pager">
          <button
            type="button"
            className={`btn btn--style-secondary btn--size-small${page <= 1 ? " btn--disabled" : ""}`}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <span className="btn__content">
              <span className="btn__label">←</span>
            </span>
          </button>
          <span className="cm-muted">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className={`btn btn--style-secondary btn--size-small${page >= totalPages ? " btn--disabled" : ""}`}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <span className="btn__content">
              <span className="btn__label">→</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
