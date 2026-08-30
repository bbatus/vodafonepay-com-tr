/**
 * A pulsing placeholder table, shown while a client-fetched table's first
 * request is still in flight (ContentManagementApp, FeesAndLimitsApp).
 *
 * Replaces a plain "Yükleniyor…" text line — the previous state was a
 * one-line hint sitting where a multi-column table is about to appear, which
 * reads as a layout jump the moment real data lands. Rendering the actual
 * `<table>`/`<th>` shell up front (bar widths only, no numbers) keeps the
 * page's shape stable across the loading→loaded transition.
 *
 * Bar widths are intentionally uneven (not a flat 100%) so the placeholder
 * reads as "text of varying length", not a plain grey box.
 */
const BAR_WIDTHS = [88, 62, 74, 55, 80, 66];

export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <div className="table-wrap" aria-hidden="true">
      <table className="cm-table cm-table--skeleton">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i}>
                <span className="skeleton-bar skeleton-bar--head" style={{ width: `${BAR_WIDTHS[i % BAR_WIDTHS.length] * 0.5}%` }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }, (_, c) => (
                <td key={c}>
                  <span className="skeleton-bar" style={{ width: `${BAR_WIDTHS[(r + c) % BAR_WIDTHS.length]}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
