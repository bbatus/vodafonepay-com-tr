"use client";

import { startTransition, useEffect, useState } from "react";
import { useAuth, useDocumentDrawer } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import ReorderWidget from "./ReorderWidget";
import { TableSkeleton } from "./TableSkeleton";
import { ROLES } from "@/access/roles";

/** Mirrors ReorderWidget's own `canReorder` — kept next to it so the two cannot drift apart silently again. */
const REORDER_ROLES = new Set<string>([ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_CHECKER]);

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

/**
 * ReorderWidget renders nothing for a role whose reorder PATCH would 403 (see
 * its own `canReorder`). The heading above it was printed unconditionally, so
 * a Growth Maker saw a "Sürükleyerek Sırala" section title with an empty page
 * under it — found live 29.08.2026. Heading and widget now live or die
 * together: same role check, one component.
 */
function ReorderSection({ collection, title, onSaved }: { collection: "fee-rows" | "limit-tables"; title: string; onSaved: () => void }) {
  const { user } = useAuth();
  const role = (user as { role?: string } | undefined)?.role;
  if (!role || !REORDER_ROLES.has(role)) return null;
  return (
    <>
      <h2 className="cm-section-title">{title}</h2>
      <ReorderWidget collection={collection} onSaved={onSaved} />
    </>
  );
}

/**
 * Found during the 28.08 UI walkthrough: this button rendered for everyone,
 * so a Growth Checker — who has `create: false` on every collection by
 * design (they approve, they don't author) — got a working-looking "Yeni
 * Ücret Satırı" whose only possible outcome was a 403 on save.
 *
 * Payload's own List view hides its Create button the same way, off the
 * global permission set; this view is hand-rolled (FeeRows/LimitTables are
 * `admin.hidden`) so it has to do that check itself. Same principle as
 * MakerAwarePublishButton: don't offer a control the server will refuse.
 *
 * `redirectAfterCreate={false}` is load-bearing, not tidiness. Payload's edit
 * view redirects to the new document's own route after a create (Edit/index.js
 * — `!isEditing && depth < 2 && redirectAfterCreate !== false`), and a drawer
 * opened straight from this view sits at depth 1, inside that window. Both of
 * these collections are `admin.hidden`, so their own routes 404 — creating a
 * fee row dropped the editor onto a black "404 This page could not be found"
 * even though the record had saved fine. Caught in the browser on 28.08; the
 * API tests never saw it because the redirect is client-side.
 */
function CreateButton({ collectionSlug, label, onSaved }: { collectionSlug: "fee-rows" | "limit-tables"; label: string; onSaved: () => void }) {
  const { permissions } = useAuth();
  const [DocDrawer, DocToggler] = useDocumentDrawer({ collectionSlug });
  if (!permissions?.collections?.[collectionSlug]?.create) return null;
  return (
    <div className="cm-toolbar">
      <DocToggler className="btn btn--style-primary btn--size-small">
        <span className="btn__content">
          <span className="btn__label">{label}</span>
        </span>
      </DocToggler>
      <DocDrawer onSave={onSaved} redirectAfterCreate={false} />
    </div>
  );
}

/**
 * The loading / empty / table triple was written out once per tab, which is
 * both a nested ternary and the same markup twice. One component instead:
 * `rows === null` means still fetching, `[]` means genuinely empty.
 */
function TablePanel<T extends { id: string | number }>({
  rows,
  headers,
  renderRow,
  emptyLabel,
}: {
  rows: T[] | null;
  headers: string[];
  renderRow: (row: T) => React.ReactNode;
  emptyLabel: string;
}) {
  let body: React.ReactNode;
  if (rows === null) {
    body = <TableSkeleton columns={headers.length} />;
  } else if (rows.length === 0) {
    body = <p className="cm-hint">{emptyLabel}</p>;
  } else {
    body = (
      <div className="table-wrap">
        <table className="cm-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{rows.map(renderRow)}</tbody>
        </table>
      </div>
    );
  }
  return <div className="card cm-card">{body}</div>;
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
          <TablePanel
            rows={feeRows}
            headers={[
              t("feesAndLimits.colLabel"),
              t("feesAndLimits.colValue"),
              t("feesAndLimits.colStatus"),
              t("feesAndLimits.colOrder"),
            ]}
            renderRow={(row) => <FeeRowRow key={row.id} row={row} onSaved={refetch} />}
            emptyLabel={t("contentManagement.empty")}
          />
          <ReorderSection collection="fee-rows" title={t("feesAndLimits.reorderTitle")} onSaved={refetch} />
        </>
      )}

      {tab === "limit-tables" && (
        <>
          <CreateButton collectionSlug="limit-tables" label={t("feesAndLimits.createLimitTable")} onSaved={refetch} />
          <TablePanel
            rows={limitTables}
            headers={[
              t("feesAndLimits.colTitleCol"),
              t("feesAndLimits.colRowCount"),
              t("feesAndLimits.colStatus"),
              t("feesAndLimits.colOrder"),
            ]}
            renderRow={(lt) => <LimitTableRow key={lt.id} lt={lt} onSaved={refetch} />}
            emptyLabel={t("contentManagement.empty")}
          />
          <ReorderSection collection="limit-tables" title={t("feesAndLimits.reorderTitle")} onSaved={refetch} />
        </>
      )}
    </div>
  );
}
