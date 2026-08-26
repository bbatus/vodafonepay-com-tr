"use client";

import { useState } from "react";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ExportTriggerButton } from "./ExportTriggerButton";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { describeApiError } from "@/lib/apiErrorMessage";
import { fetchExportDocs, pingExportAudit } from "@/lib/exportFetch";

export type CsvTable = { header: string[]; rows: string[][] };

/**
 * Shared implementation behind every "Dışa Aktar (CSV)" button (Users, Audit
 * Logs, Campaigns). Extracted when the third one was added — the first two had
 * drifted into near-identical copies of the same fetch/serialise/download/toast
 * sequence, differing only in collection slug and column list.
 *
 * Payload mounts admin components by string path with serialisable
 * `clientProps` only, so `buildTable` can't cross that boundary. Each
 * collection therefore keeps a thin default-export wrapper that owns its
 * columns and renders this — the wrappers hold no logic.
 *
 * Payload's list view keeps the active `where`/`sort` in the page URL; this
 * forwards both, so exporting after a search/filter exports what's ON SCREEN.
 * `limit` is always overridden because the visible page is paginated to 10 but
 * an export should carry every matching row.
 */
export function CsvExportButton<T>({
  collection,
  defaultSort,
  depth = 0,
  filenamePrefix,
  translationPrefix,
  buildTable,
}: {
  collection: string;
  defaultSort: string;
  depth?: number;
  filenamePrefix: string;
  translationPrefix: string;
  buildTable: (docs: T[], locale: "tr" | "en") => CsvTable;
}) {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const docs = await fetchExportDocs<T>({ collection, defaultSort, depth, locale });
      const { header, rows } = buildTable(docs, locale);
      downloadCsv(buildCsv(header, rows), `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(t(`${translationPrefix}.done`));
      // RFP §7.2: "record every export of predefined reports/data entities"
      pingExportAudit(collection, rows.length);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : describeApiError({ err, locale, context: "export" }));
    } finally {
      setExporting(false);
    }
  };

  return (
    <ExportTriggerButton
      exporting={exporting}
      label={exporting ? t(`${translationPrefix}.exporting`) : t(`${translationPrefix}.button`)}
      onClick={() => void handleExport()}
    />
  );
}
