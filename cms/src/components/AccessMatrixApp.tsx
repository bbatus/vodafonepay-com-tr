"use client";

import { useMemo, useState } from "react";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { getAccessMatrixRows, getRoleDirectory, type PermissionFlags } from "@/lib/rolePermissions";
import { buildCsv, downloadCsv } from "@/lib/csv";

const FLAG_ORDER: (keyof PermissionFlags)[] = ["view", "create", "update", "publish", "delete"];

const FLAG_LABEL: Record<keyof PermissionFlags, { tr: string; en: string }> = {
  view: { tr: "Görüntüle", en: "View" },
  create: { tr: "Oluştur", en: "Create" },
  update: { tr: "Düzenle", en: "Update" },
  publish: { tr: "Yayınla", en: "Publish" },
  delete: { tr: "Sil", en: "Delete" },
};

/** Single-letter sub-column header under each role — full name is the header's own title tooltip. */
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
 * Follow-up 25.08 (second pass): "eski görüntü... tik ve çarpılarla daha
 * okunurdu ... sadece onu tik çarpı ile değiştir". Combines both rounds of
 * feedback: the matrix layout (roles as column GROUPS, one row per
 * collection) from the first pass, plus the plain ✓/✗-per-permission
 * legibility of the very first version — a two-row header (role, then its 5
 * permissions) keeps every icon under a labeled column instead of relying on
 * position/tooltip alone to say which permission it is.
 */
/**
 * Local tr/en map rather than `useDbStrings` keys: these five labels describe
 * the AccessPoint role table itself, which is fixed reference data, not
 * editor-tunable microcopy. Same `STRINGS` pattern AGENTS.md documents for
 * admin components (ReorderWidget/HelpButton).
 */
const DIR_STRINGS = {
  tr: { role: "Rol", group: "AccessPoint Rol Adı", department: "Yetkili Departman", approver: "Rol Sorumlusu", critical: "Kritik mi?", yes: "Evet", no: "Hayır" },
  en: { role: "Role", group: "AccessPoint Role Name", department: "Owning Department", approver: "Role Approver", critical: "Critical?", yes: "Yes", no: "No" },
};

export default function AccessMatrixApp() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const rows = useMemo(() => getAccessMatrixRows(), []);
  const roleDirectory = useMemo(() => getRoleDirectory(), []);
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
      // Follow-up 28.08: the AccessPoint group name travels with the export,
      // so the CSV an auditor receives is self-describing.
      DIR_STRINGS[locale].group,
      DIR_STRINGS[locale].department,
      DIR_STRINGS[locale].approver,
      ...FLAG_ORDER.map((f) => FLAG_LABEL[f][locale]),
    ];
    const csvRows = rows.map((r) => [
      r.collectionLabel[locale],
      r.roleLabel[locale],
      r.ldapGroup,
      r.department[locale],
      r.approver,
      ...FLAG_ORDER.map((f) => (r.flags[f] ? "1" : "0")),
    ]);
    downloadCsv(buildCsv(header, csvRows), `kullanici-erisim-matrisi-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="access-matrix">
      <p className="access-matrix__intro">{t("accessMatrix.intro")}</p>

      {/* Follow-up 28.08: the matrix below names roles by our own friendly
          label ("Growth — Maker"), which an auditor cannot line up against
          the AccessPoint role table they were given. This panel is that
          missing link: each role's real AD group name, the department that
          owns it, and who approves a request for it. Source data:
          access/roleMapping.ts's ROLE_DIRECTORY. */}
      <div className="table-wrap">
        <table className="access-matrix__table access-matrix__table--directory">
          <thead>
            <tr>
              <th scope="col">{DIR_STRINGS[locale].role}</th>
              <th scope="col">{DIR_STRINGS[locale].group}</th>
              <th scope="col">{DIR_STRINGS[locale].department}</th>
              <th scope="col">{DIR_STRINGS[locale].approver}</th>
              <th scope="col">{DIR_STRINGS[locale].critical}</th>
            </tr>
          </thead>
          <tbody>
            {roleDirectory.map((r) => (
              <tr key={r.role}>
                <th scope="row" className="access-matrix__collection-cell">
                  {r.roleLabel[locale]}
                  <div className="access-matrix__role-summary">{r.summary[locale]}</div>
                </th>
                <td>
                  <code>{r.ldapGroup}</code>
                </td>
                <td>{r.department[locale]}</td>
                <td>{r.approver}</td>
                <td title={r.criticalNotice[locale]}>{r.critical ? DIR_STRINGS[locale].yes : DIR_STRINGS[locale].no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            <span className="access-matrix__col-flag" title={FLAG_LABEL[f][locale]}>
              {FLAG_SHORT[f][locale]}
            </span>
            = {FLAG_LABEL[f][locale]}
          </li>
        ))}
      </ul>

      <div className="table-wrap">
        <table className="access-matrix__table access-matrix__table--sticky">
          <thead>
            <tr>
              <th rowSpan={2} className="access-matrix__col-collection">
                {t("accessMatrix.column.collection")}
              </th>
              {roles.map(([role, label]) => (
                <th key={role} colSpan={FLAG_ORDER.length} className="access-matrix__col-role">
                  {label}
                </th>
              ))}
            </tr>
            <tr>
              {roles.map(([role]) =>
                FLAG_ORDER.map((f) => (
                  <th key={`${role}-${f}`} className="access-matrix__col-flag" title={FLAG_LABEL[f][locale]}>
                    {FLAG_SHORT[f][locale]}
                  </th>
                ))
              )}
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
                  return FLAG_ORDER.map((f) => {
                    const on = flags ? flags[f] : false;
                    return (
                      <td key={`${role}-${f}`} className="access-matrix__cell" title={FLAG_LABEL[f][locale]}>
                        <span className={`access-matrix__icon${on ? " access-matrix__icon--on" : " access-matrix__icon--off"}`}>
                          {on ? "✓" : "✗"}
                        </span>
                      </td>
                    );
                  });
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={roles.length * FLAG_ORDER.length + 1} className="access-matrix__empty">
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
