/**
 * Shared by every "Dışa Aktar (CSV)" button (UsersExportButton, AuditLogsExportButton).
 * A real .xlsx would need the `xlsx` (SheetJS) npm package, which as of this
 * writing carries two unpatched high-severity advisories (prototype pollution +
 * ReDoS) on the npm registry — SheetJS moved fixes to their own CDN outside
 * npm. That's incompatible with this repo's zero-known-vulnerability policy
 * (AGENTS.md, R-13/R-14), so every export uses CSV instead: semicolon-delimited
 * (the default list separator for Turkish-locale Excel) with a UTF-8 BOM,
 * which is what actually makes ç/ğ/ı/ö/ş/ü render correctly when Excel
 * double-click-opens the file — without a BOM, Excel guesses ANSI/Windows-1254
 * and mangles them.
 */
export function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((row) => row.map((cell) => csvEscape(cell)).join(";")).join("\r\n");
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function formatDateTr(iso: string | undefined | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("tr-TR");
}

/**
 * Flattens a Payload lexical richText document to a single line of plain text
 * for the campaign export (RFP feedback 5.7). Newlines are collapsed to
 * spaces on purpose: a hard newline inside a quoted CSV cell is legal, but
 * some Excel builds still render it as a broken multi-row record, and a
 * spreadsheet cell isn't where anyone reads long-form copy anyway.
 */
export function richTextToPlainText(node: unknown): string {
  const extract = (n: unknown): string => {
    if (!n || typeof n !== "object") return "";
    const obj = n as { text?: string; children?: unknown[] };
    if (typeof obj.text === "string") return obj.text;
    if (Array.isArray(obj.children)) return obj.children.map(extract).join(" ");
    return "";
  };
  const root = (node as { root?: { children?: unknown[] } } | null | undefined)?.root;
  if (!root?.children) return "";
  return root.children.map(extract).join(" ").replace(/\s+/g, " ").trim();
}
