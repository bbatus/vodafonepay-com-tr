"use client";

import { useState } from "react";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { buildCsv, downloadCsv, formatDateTr } from "@/lib/csv";

type ExportLog = {
  createdAt?: string;
  userEmail?: string;
  userRole?: string;
  action?: string;
  collectionSlug?: string;
  summary?: string;
  ip?: string;
  userAgent?: string;
};

const ACTION_LABELS: Record<string, string> = {
  login: "Giriş",
  login_failed: "Başarısız giriş",
  logout: "Çıkış",
  create: "Oluşturuldu",
  update: "Güncellendi",
  publish: "Yayınlandı",
  rejected: "Reddedildi",
  delete: "Silindi",
};

/**
 * RFP feedback: audit log CSV export, same lib/csv.ts convention as
 * UsersExportButton. Payload's own list view keeps the active `where`/`sort`
 * filter in the page URL — this reads that straight off
 * `window.location.search` and forwards it, so exporting after searching/
 * filtering exports what's ON SCREEN, not the whole table. `limit` is
 * always overridden to a large number: the visible page is paginated to
 * 10, but an export should include every matching row, not just page 1.
 */
export default function AuditLogsExportButton() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const currentParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      const where = currentParams.get("where");
      const sort = currentParams.get("sort");
      if (where) params.set("where", where);
      params.set("sort", sort ?? "-createdAt");
      params.set("limit", "10000");
      params.set("depth", "0");

      const res = await fetch(`/api/audit-logs?${params.toString()}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const docs: ExportLog[] = data.docs ?? [];

      const header = ["Tarih", "Kullanıcı", "Rol", "İşlem", "Koleksiyon", "Özet", "IP", "Cihaz / Tarayıcı"];
      const rows = docs.map((d) => [
        formatDateTr(d.createdAt),
        d.userEmail ?? "",
        d.userRole ?? "",
        (d.action && ACTION_LABELS[d.action]) ?? d.action ?? "",
        d.collectionSlug ?? "",
        d.summary ?? "",
        d.ip ?? "",
        d.userAgent ?? "",
      ]);
      const csv = buildCsv(header, rows);
      downloadCsv(csv, `denetim-kayitlari-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(t("auditLogsExport.done"));
    } catch {
      toast.error(t("auditLogsExport.error"));
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
        <span className="btn__label">{exporting ? t("auditLogsExport.exporting") : t("auditLogsExport.button")}</span>
      </span>
    </button>
  );
}
