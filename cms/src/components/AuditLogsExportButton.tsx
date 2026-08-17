"use client";

import { formatDateTr } from "@/lib/csv";
import { CsvExportButton, type CsvTable } from "./CsvExportButton";

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

/**
 * RFP feedback: audit-log CSV export. Columns only — the fetch/serialise/
 * download/toast sequence (and the "carry the on-screen where/sort into the
 * export" behaviour) lives in the shared CsvExportButton.
 */
const ACTION_LABELS: Record<string, { tr: string; en: string }> = {
  login: { tr: "Giriş", en: "Login" },
  login_failed: { tr: "Başarısız giriş", en: "Failed login" },
  logout: { tr: "Çıkış", en: "Logout" },
  create: { tr: "Oluşturuldu", en: "Created" },
  update: { tr: "Güncellendi", en: "Updated" },
  publish: { tr: "Yayınlandı", en: "Published" },
  rejected: { tr: "Reddedildi", en: "Rejected" },
  delete: { tr: "Silindi", en: "Deleted" },
  unlock: { tr: "Kilit kaldırıldı", en: "Unlocked" },
};

const HEADER = {
  tr: ["Tarih", "Kullanıcı", "Rol", "İşlem", "Koleksiyon", "Özet", "IP", "Cihaz / Tarayıcı"],
  en: ["Date", "User", "Role", "Action", "Collection", "Summary", "IP", "Device / Browser"],
};

function buildTable(docs: ExportLog[], locale: "tr" | "en"): CsvTable {
  return {
    header: HEADER[locale],
    rows: docs.map((d) => [
      formatDateTr(d.createdAt),
      d.userEmail ?? "",
      d.userRole ?? "",
      (d.action && ACTION_LABELS[d.action]?.[locale]) ?? d.action ?? "",
      d.collectionSlug ?? "",
      d.summary ?? "",
      d.ip ?? "",
      d.userAgent ?? "",
    ]),
  };
}

export default function AuditLogsExportButton() {
  return (
    <CsvExportButton<ExportLog>
      collection="audit-logs"
      defaultSort="-createdAt"
      filenamePrefix="denetim-kayitlari"
      translationPrefix="auditLogsExport"
      buildTable={buildTable}
    />
  );
}
