"use client";

import { useState } from "react";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { buildCef, downloadCef, type CefEvent } from "@/lib/cef";
import { describeApiError } from "@/lib/apiErrorMessage";

/**
 * RFP §6: "export audit logs in CEF format for SIEM ingestion". Mirrors
 * CsvExportButton.tsx's fetch/serialise/download/toast/audit-ping sequence
 * exactly — same on-screen where/sort forwarding, same best-effort export
 * logging — just a CEF body instead of a CSV one. Kept as its own component
 * rather than generalising CsvExportButton further: the two output formats
 * don't share a `buildTable`-shaped seam (CEF has no header row / column
 * list), so forcing them through one abstraction would cost more than the
 * ~15 duplicated lines it'd save.
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
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      const where = currentParams.get("where");
      const search = currentParams.get("search");
      if (where) params.set("where", where);
      if (search) params.set("search", search);
      params.set("sort", currentParams.get("sort") ?? defaultSort);
      params.set("limit", "10000");
      params.set("depth", String(depth));

      const res = await fetch(`/api/${collection}?${params.toString()}`, { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(describeApiError({ status: res.status, body, locale, context: "export" }));
      }
      const data = (await res.json()) as { docs?: T[] };
      const events = buildEvents(data.docs ?? []);
      downloadCef(buildCef(events), `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.cef`);
      toast.success(t(`${translationPrefix}.done`));
      void fetch("/api/audit/export", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection, count: events.length }),
      }).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : describeApiError({ err, locale, context: "export" }));
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn--style-secondary btn--size-medium${exporting ? " btn--disabled" : ""}`}
      disabled={exporting}
      onClick={() => void handleExport()}
    >
      <span className="btn__content">
        <span className="btn__label">
          {exporting ? t(`${translationPrefix}.exporting`) : t(`${translationPrefix}.button`)}
        </span>
      </span>
    </button>
  );
}
