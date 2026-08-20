"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import ReorderWidget from "./ReorderWidget";

type FeeRow = { id: string | number; label: string; value: string; order: number; _status?: string };
type LimitTable = { id: string | number; title: string; order: number; _status?: string; rows?: { category: string }[] };

type Tab = "fee-rows" | "limit-tables";

const TAB_LABELS: Record<Tab, { tr: string; en: string }> = {
  "fee-rows": { tr: "Ücret Tablosu", en: "Fee Rows" },
  "limit-tables": { tr: "Limit Tabloları", en: "Limit Tables" },
};

/**
 * RFP follow-up: one page, two tabs, instead of two separate sidebar
 * entries — see FeesAndLimitsView.tsx's doc comment for why. Each tab is:
 * a real data table (link to the doc's real edit page + published/draft
 * badge) with a "Yeni Oluştur" link, and the EXISTING ReorderWidget
 * embedded directly below it (same component FeeRows/LimitTables already
 * used via `beforeList` — reused as-is here, it's self-contained).
 */
export default function FeesAndLimitsApp() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [tab, setTab] = useState<Tab>("fee-rows");
  const [feeRows, setFeeRows] = useState<FeeRow[] | null>(null);
  const [limitTables, setLimitTables] = useState<LimitTable[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reorderKey, setReorderKey] = useState(0);
  const refetchAfterReorder = () => setReorderKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => setError(null));
    const load = async () => {
      try {
        const [feeRes, limitRes] = await Promise.all([
          fetch("/api/fee-rows?depth=0&limit=200&sort=order", { credentials: "same-origin" }),
          fetch("/api/limit-tables?depth=0&limit=200&sort=order", { credentials: "same-origin" }),
        ]);
        if (!feeRes.ok || !limitRes.ok) throw new Error("fetch failed");
        const feeData = await feeRes.json();
        const limitData = await limitRes.json();
        if (cancelled) return;
        setFeeRows(feeData.docs ?? []);
        setLimitTables(limitData.docs ?? []);
      } catch {
        if (!cancelled) setError(t("contentManagement.noAccess"));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // reorderKey bump (via ReorderWidget's onSaved below) forces this summary
    // table to refetch after a drag-reorder save — see ReorderWidget.tsx's
    // `onSaved` prop comment for why router.refresh() alone isn't enough here.
  }, [reorderKey, t]);

  const statusBadge = (status?: string) =>
    status === "published" ? (
      <span className="cm-badge cm-badge--published">{t("contentManagement.published")}</span>
    ) : (
      <span className="cm-badge">{t("contentManagement.draft")}</span>
    );

  return (
    <div className="cm">
      <h1>{t("feesAndLimits.title")}</h1>
      <p className="cm-hint">{t("feesAndLimits.intro")}</p>

      <div className="cm-tabs">
        {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`cm-tab${tab === key ? " cm-tab--active" : ""}`}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {TAB_LABELS[key][locale]}
          </button>
        ))}
      </div>

      {error && <p className="cm-error">{error}</p>}

      {tab === "fee-rows" && (
        <>
          <div className="cm-toolbar">
            <Link href="/admin/collections/fee-rows/create" className="btn btn--style-primary btn--size-small">
              <span className="btn__content">
                <span className="btn__label">{t("feesAndLimits.createFeeRow")}</span>
              </span>
            </Link>
          </div>
          <div className="card cm-card">
            {feeRows === null ? (
              <p className="cm-hint">{t("contentManagement.loading")}</p>
            ) : feeRows.length === 0 ? (
              <p className="cm-hint">{t("contentManagement.empty")}</p>
            ) : (
              <div className="table-wrap">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>{t("feesAndLimits.colLabel")}</th>
                      <th>{t("feesAndLimits.colValue")}</th>
                      <th>{t("feesAndLimits.colStatus")}</th>
                      <th>{t("feesAndLimits.colOrder")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link href={`/admin/collections/fee-rows/${row.id}`}>{row.label}</Link>
                        </td>
                        <td>{row.value}</td>
                        <td>{statusBadge(row._status)}</td>
                        <td>{row.order}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <h2 className="cm-section-title">{t("feesAndLimits.reorderTitle")}</h2>
          <ReorderWidget collection="fee-rows" onSaved={refetchAfterReorder} />
        </>
      )}

      {tab === "limit-tables" && (
        <>
          <div className="cm-toolbar">
            <Link href="/admin/collections/limit-tables/create" className="btn btn--style-primary btn--size-small">
              <span className="btn__content">
                <span className="btn__label">{t("feesAndLimits.createLimitTable")}</span>
              </span>
            </Link>
          </div>
          <div className="card cm-card">
            {limitTables === null ? (
              <p className="cm-hint">{t("contentManagement.loading")}</p>
            ) : limitTables.length === 0 ? (
              <p className="cm-hint">{t("contentManagement.empty")}</p>
            ) : (
              <div className="table-wrap">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>{t("feesAndLimits.colTitleCol")}</th>
                      <th>{t("feesAndLimits.colRowCount")}</th>
                      <th>{t("feesAndLimits.colStatus")}</th>
                      <th>{t("feesAndLimits.colOrder")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {limitTables.map((lt) => (
                      <tr key={lt.id}>
                        <td>
                          <Link href={`/admin/collections/limit-tables/${lt.id}`}>{lt.title}</Link>
                        </td>
                        <td>{lt.rows?.length ?? 0}</td>
                        <td>{statusBadge(lt._status)}</td>
                        <td>{lt.order}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <h2 className="cm-section-title">{t("feesAndLimits.reorderTitle")}</h2>
          <ReorderWidget collection="limit-tables" onSaved={refetchAfterReorder} />
        </>
      )}
    </div>
  );
}
