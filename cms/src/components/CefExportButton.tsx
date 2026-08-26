"use client";

import { useState } from "react";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ExportTriggerButton } from "./ExportTriggerButton";
import { buildCef, downloadCef, type CefEvent } from "@/lib/cef";
import { describeApiError } from "@/lib/apiErrorMessage";
import { fetchExportDocs, pingExportAudit } from "@/lib/exportFetch";

/**
 * RFP §6: "export audit logs in CEF format for SIEM ingestion". Shares the
 * on-screen where/sort forwarding + fetch + best-effort export-audit ping
 * with CsvExportButton.tsx via `fetchExportDocs`/`pingExportAudit`
 * (src/lib/exportFetch.ts) and the button markup via `<ExportTriggerButton>`.
 * Kept as its own component rather than generalising further: the two output
 * FORMATS don't share a `buildTable`-shaped seam (CEF has no header row /
 * column list), so forcing serialization through one abstraction would cost
 * more than it saves — only the fetch/button seam, which genuinely was
 * identical, got extracted.
 */
export function CefExportButton<T extends CefEvent>({
  collection,
  defaultSort,
  depth = 0,
  filenamePrefix,
  translationPrefix,
  buildEvents,
}: {
  collection: string;
  defaultSort: string;
  depth?: number;
  filenamePrefix: string;
  translationPrefix: string;
  buildEvents: (docs: T[]) => CefEvent[];
}) {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const docs = await fetchExportDocs<T>({ collection, defaultSort, depth, locale });
      const events = buildEvents(docs);
      downloadCef(buildCef(events), `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.cef`);
      toast.success(t(`${translationPrefix}.done`));
      pingExportAudit(collection, events.length);
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
