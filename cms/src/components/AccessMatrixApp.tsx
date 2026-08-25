"use client";

import { useMemo, useState } from "react";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { getAccessMatrixRows, type PermissionFlags } from "@/lib/rolePermissions";
import { buildCsv, downloadCsv } from "@/lib/csv";

const FLAG_ORDER: (keyof PermissionFlags)[] = ["view", "create", "update", "publish", "delete"];

const FLAG_LABEL: Record<keyof PermissionFlags, { tr: string; en: string }> = {
  view: { tr: "Görüntüle", en: "View" },
  create: { tr: "Oluştur", en: "Create" },
  update: { tr: "Düzenle", en: "Update" },
  publish: { tr: "Yayınla", en: "Publish" },
  delete: { tr: "Sil", en: "Delete" },
};

/** One-letter badge per permission — full name is in the title/legend. */
const FLAG_SHORT: Record<keyof PermissionFlags, { tr: string; en: string }> = {
  view: { tr: "G", en: "V" },
  create: { tr: "O", en: "C" },
  update: { tr: "D", en: "U" },
  publish: { tr: "Y", en: "P" },
  delete: { tr: "S", en: "D" },
};

/**
 * RFP §7 "userID comparison tables" — see getAccessMatrixRows()'s doc comment
 * for the interpretation.
 *
 * Follow-up 25.08 ("görünümünü de biraz daha iyileştirebiliriz"): the first
 * version printed one row per collection×role — 21 collections × 4 roles = 84
 * rows of mostly "—", which is a list, not a matrix. It answered "what can
 * this role do here?" but not the question the screen exists for: "how do
 * these four roles DIFFER on this collection?", which needs them side by side.
 *
 * Now genuinely two-dimensional: one row per collection, one column per role,
 * each cell a compact row of permission badges. A reader compares four cells
 * on one line instead of scrolling four rows apart. Plus a filter box (21
 * collections is more than fits on a screen) and a sticky header (the role
 * you're looking at has to stay visible while you scroll).
 */
export default function AccessMatrixApp() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const rows = useMemo(() => getAccessMatrixRows(), []);
  const [query, setQuery] = useState("");

  const roles = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) if (!seen.has(r.role)) seen.set(r.role, r.roleLabel[locale]);
    return [...seen.entries()];
  }, [rows, locale]);

  const collections = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) if (!seen.has(r.collectionSlug)) seen.set(r.collectionSlug, r.collectionLabel[locale]);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], locale));
  }, [rows, locale]);

  const flagsFor = (collectionSlug: string, role: string): PermissionFlags | undefined =>
    rows.find((r) => r.collectionSlug === collectionSlug && r.role === role)?.flags;

  const filtered = collections.filter(
    ([slug, label]) =>
      !query.trim() ||
      label.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)) ||
      slug.includes(query.toLowerCase())
  );

  const handleExport = () => {
    // CSV stays one row per collection×role: a spreadsheet is filtered and
    // pivoted by its reader, so the long form is the more useful export even
    // though the short form is the better screen.
    const header = [
      t("accessMatrix.column.collection"),
      t("accessMatrix.column.role"),
      ...FLAG_ORDER.map((f) => FLAG_LABEL[f][locale]),
    ];
    const csvRows = rows.map((r) => [
      r.collectionLabel[locale],
      r.roleLabel[locale],
      ...FLAG_ORDER.map((f) => (r.flags[f] ? "1" : "0")),
    ]);
    downloadCsv(buildCsv(header, csvRows), `kullanici-erisim-matrisi-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="access-matrix">
      <p className="access-matrix__intro">{t("accessMatrix.intro")}</p>

      <div className="access-matrix__toolbar">
        <input
          type="search"
          className="access-matrix__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("accessMatrix.searchPlaceholder")}
          aria-label={t("accessMatrix.searchPlaceholder")}
        />
        <button type="button" className="btn btn--style-secondary btn--size-medium" onClick={handleExport}>
          <span className="btn__content">
            <span className="btn__label">{t("accessMatrix.export")}</span>
          </span>
        </button>
      </div>

      <ul className="access-matrix__legend">
        {FLAG_ORDER.map((f) => (
          <li key={f} className="access-matrix__legend-item">
            <span className="access-matrix__badge access-matrix__badge--on">{FLAG_SHORT[f][locale]}</span>
            {FLAG_LABEL[f][locale]}
          </li>
        ))}
        <li className="access-matrix__legend-item access-matrix__legend-item--muted">
          <span className="access-matrix__badge">{FLAG_SHORT.view[locale]}</span>
          {t("accessMatrix.legendOff")}
        </li>
      </ul>

      <div className="table-wrap">
        <table className="access-matrix__table">
          <thead>
            <tr>
              <th className="access-matrix__col-collection">{t("accessMatrix.column.collection")}</th>
              {roles.map(([role, label]) => (
                <th key={role} className="access-matrix__col-role">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(([slug, label]) => (
              <tr key={slug}>
                <th scope="row" className="access-matrix__collection-cell">
                  {label}
                  <code className="access-matrix__slug">{slug}</code>
                </th>
                {roles.map(([role]) => {
                  const flags = flagsFor(slug, role);
                  if (!flags) return <td key={role} />;
                  const none = FLAG_ORDER.every((f) => !flags[f]);
                  return (
                    <td key={role} className="access-matrix__cell">
                      {none ? (
                        <span className="access-matrix__none">{t("accessMatrix.noAccess")}</span>
                      ) : (
                        <span className="access-matrix__badges">
                          {FLAG_ORDER.map((f) => (
                            <span
                              key={f}
                              title={`${FLAG_LABEL[f][locale]}: ${flags[f] ? "✓" : "—"}`}
                              className={`access-matrix__badge${flags[f] ? " access-matrix__badge--on" : ""}`}
                            >
                              {FLAG_SHORT[f][locale]}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={roles.length + 1} className="access-matrix__empty">
                  {t("accessMatrix.noMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
