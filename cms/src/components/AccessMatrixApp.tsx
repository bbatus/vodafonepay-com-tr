"use client";

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

function FlagMark({ on }: { on: boolean }) {
  return (
    <span className={`access-matrix__flag${on ? " access-matrix__flag--on" : ""}`} aria-label={on ? "yes" : "no"}>
      {on ? "✓" : "—"}
    </span>
  );
}

/**
 * RFP §7 "userID comparison tables" — see getAccessMatrixRows()'s doc comment
 * for the interpretation. NEW_VERTICAL_MAKER-only, same gate as
 * LockedAccountsView/AccessMatrixView above this component.
 */
export default function AccessMatrixApp() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const rows = getAccessMatrixRows();

  const collections = Array.from(new Set(rows.map((r) => r.collectionSlug))).sort();
  const roles = Array.from(new Set(rows.map((r) => r.role)));

  const handleExport = () => {
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
      <button type="button" className="btn btn--style-secondary btn--size-medium access-matrix__export" onClick={handleExport}>
        <span className="btn__content">
          <span className="btn__label">{t("accessMatrix.export")}</span>
        </span>
      </button>
      <div className="table-wrap">
        <table className="access-matrix__table">
          <thead>
            <tr>
              <th>{t("accessMatrix.column.collection")}</th>
              <th>{t("accessMatrix.column.role")}</th>
              {FLAG_ORDER.map((f) => (
                <th key={f}>{FLAG_LABEL[f][locale]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collections.map((collectionSlug) =>
              roles.map((role, i) => {
                const row = rows.find((r) => r.collectionSlug === collectionSlug && r.role === role);
                if (!row) return null;
                return (
                  <tr key={`${collectionSlug}-${role}`}>
                    {i === 0 ? (
                      <td rowSpan={roles.length} className="access-matrix__collection-cell">
                        {row.collectionLabel[locale]}
                      </td>
                    ) : null}
                    <td>{row.roleLabel[locale]}</td>
                    {FLAG_ORDER.map((f) => (
                      <td key={f}>
                        <FlagMark on={row.flags[f]} />
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
