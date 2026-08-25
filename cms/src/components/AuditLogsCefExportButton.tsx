"use client";

import type { CefEvent } from "@/lib/cef";
import { CefExportButton } from "./CefExportButton";

type ExportLog = CefEvent & { id?: string | number };

/**
 * RFP §6: "export audit logs in CEF format for SIEM ingestion (e.g.
 * ArcSight)". No transformation needed beyond dropping `id` — the audit-logs
 * REST shape already matches CefEvent field-for-field.
 */
function buildEvents(docs: ExportLog[]): CefEvent[] {
  return docs.map((d) => ({
    createdAt: d.createdAt,
    userEmail: d.userEmail,
    userRole: d.userRole,
    action: d.action,
    collectionSlug: d.collectionSlug,
    documentId: d.documentId,
    summary: d.summary,
    ip: d.ip,
    userAgent: d.userAgent,
  }));
}

export default function AuditLogsCefExportButton() {
  return (
    <CefExportButton<ExportLog>
      collection="audit-logs"
      defaultSort="-createdAt"
      filenamePrefix="denetim-kayitlari-cef"
      translationPrefix="auditLogsCefExport"
      buildEvents={buildEvents}
    />
  );
}
