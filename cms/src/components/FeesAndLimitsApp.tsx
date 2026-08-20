"use client";

import { startTransition, useEffect, useState } from "react";
import { useDocumentDrawer } from "@payloadcms/ui";
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
 * FeeRows/LimitTables are `admin.hidden: true` (see their collection files)
 * so this combined page is the ONLY way to reach them — no more separate
 * sidebar entries or direct /admin/collections/{slug} routes (those now
 * genuinely 404, confirmed live). `admin.hidden` also removes them from
 * Payload's `visibleEntities`, which the normal Document/List views check
 * and 404 on — so editing/creating here goes through `useDocumentDrawer`
 * instead of a real navigation link, since DocumentDrawer defaults
 * `overrideEntityVisibility` to true and bypasses that check.
 */
function FeeRowRow({ row, onSaved }: { row: FeeRow; onSaved: () => void }) {
  const t = useDbStrings(useAdminLocale());
  const [DocDrawer, DocToggler] = useDocumentDrawer({ collectionSlug: "fee-rows", id: row.id });
  return (
    <tr>
      <td>
        <DocToggler>{row.label}</DocToggler>
        <DocDrawer onSave={onSaved} />
      </td>
      <td>{row.value}</td>
      <td>
        {row._status === "published" ? (
          <span className="cm-badge cm-badge--published">{t("contentManagement.published")}</span>
        ) : (
          <span className="cm-badge">{t("contentManagement.draft")}</span>
        )}
      </td>
      <td>{row.order}</td>
    </tr>
  );
}

function LimitTableRow({ lt, onSaved }: { lt: LimitTable; onSaved: () => void }) {
  const t = useDbStrings(useAdminLocale());
  const [DocDrawer, DocToggler] = useDocumentDrawer({ collectionSlug: "limit-tables", id: lt.id });
  return (
    <tr>
      <td>
        <DocToggler>{lt.title}</DocToggler>
        <DocDrawer onSave={onSaved} />
      </td>
      <td>{lt.rows?.length ?? 0}</td>
      <td>
        {lt._status === "published" ? (
          <span className="cm-badge cm-badge--published">{t("contentManagement.published")}</span>
        ) : (
          <span className="cm-badge">{t("contentManagement.draft")}</span>
        )}
      </td>
      <td>{lt.order}</td>
    </tr>
  );
}

function CreateButton({ collectionSlug, label, onSaved }: { collectionSlug: "fee-rows" | "limit-tables"; label: string; onSaved: () => void }) {
  const [DocDrawer, DocToggler] = useDocumentDrawer({ collectionSlug });
  return (
    <div className="cm-toolbar">
      <DocToggler className="btn btn--style-primary btn--size-small">
        <span className="btn__content">
          <span className="btn__label">{label}</span>
        </span>
      </DocToggler>
      <DocDrawer onSave={onSaved} />
    </div>
  );
}

export default function FeesAndLimitsApp() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [tab, setTab] = useState<Tab>("fee-rows");
  const [feeRows, setFeeRows] = useState<FeeRow[] | null>(null);
  const [limitTables, setLimitTables] = useState<LimitTable[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reorderKey, setReorderKey] = useState(0);
  const refetch = () => setReorderKey((k) => k + 1);

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
    // reorderKey bump (via ReorderWidget's onSaved / drawer onSave below)
    // forces this summary table to refetch — see ReorderWidget.tsx's
    // `onSaved` prop comment for why router.refresh() alone isn't enough here.
  }, [reorderKey, t]);

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
          <CreateButton collectionSlug="fee-rows" label={t("feesAndLimits.createFeeRow")} onSaved={refetch} />
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
                      <FeeRowRow key={row.id} row={row} onSaved={refetch} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <h2 className="cm-section-title">{t("feesAndLimits.reorderTitle")}</h2>
          <ReorderWidget collection="fee-rows" onSaved={refetch} />
        </>
      )}

      {tab === "limit-tables" && (
        <>
          <CreateButton collectionSlug="limit-tables" label={t("feesAndLimits.createLimitTable")} onSaved={refetch} />
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
                      <LimitTableRow key={lt.id} lt={lt} onSaved={refetch} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <h2 className="cm-section-title">{t("feesAndLimits.reorderTitle")}</h2>
          <ReorderWidget collection="limit-tables" onSaved={refetch} />
        </>
      )}
    </div>
  );
}
