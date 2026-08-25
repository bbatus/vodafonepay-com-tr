"use client";

import { ROLE_OPTIONS } from "@/access/roles";
import { formatDateTr } from "@/lib/csv";
import { CsvExportButton, type CsvTable } from "./CsvExportButton";

type ExportUser = {
  email?: string;
  role?: string;
  preferredLocale?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  lockUntil?: string | null;
};

/**
 * RFP feedback: "users listesinde export alabilmeliydik excel ya da pdf ya da
 * word gibi. türkçe karakterleri destekleyecek şekilde." A real .xlsx would
 * need the `xlsx` (SheetJS) npm package, which carries two unpatched
 * high-severity advisories (prototype pollution + ReDoS) on the npm registry —
 * SheetJS moved fixes to their own CDN outside npm. That's incompatible with
 * this repo's zero-known-vulnerability policy (AGENTS.md, R-13/R-14), so this
 * exports CSV — see lib/csv.ts for why semicolon-delimited + UTF-8 BOM is what
 * actually keeps ç/ğ/ı/ö/ş/ü intact when Excel opens the file.
 *
 * Fetch/serialise/download/toast lives in CsvExportButton, shared with the
 * audit-log and campaign exports; this file is just the column list.
 */
const HEADER = {
  tr: ["E-posta", "Rol", "Dil Tercihi", "Hesap Durumu", "Son Giriş", "Son Giriş IP", "Oluşturulma", "Güncellenme"],
  en: ["Email", "Role", "Language Preference", "Account Status", "Last Login", "Last Login IP", "Created", "Updated"],
};

const LABELS = {
  tr: { turkish: "Türkçe", english: "English", locked: "Kilitli", active: "Aktif" },
  en: { turkish: "Turkish", english: "English", locked: "Locked", active: "Active" },
};

function roleLabel(role: string | undefined): string {
  return ROLE_OPTIONS.find((opt) => opt.value === role)?.label ?? role ?? "";
}

function buildTable(docs: ExportUser[], locale: "tr" | "en"): CsvTable {
  const L = LABELS[locale];
  return {
    header: HEADER[locale],
    rows: docs.map((u) => [
      u.email ?? "",
      roleLabel(u.role),
      u.preferredLocale === "en" ? L.english : L.turkish,
      // RFP feedback 5.6: lock state belongs in the export too, not just the list.
      u.lockUntil && new Date(u.lockUntil) > new Date() ? `${L.locked} (${formatDateTr(u.lockUntil)})` : L.active,
      formatDateTr(u.lastLoginAt),
      u.lastLoginIp ?? "",
      formatDateTr(u.createdAt),
      formatDateTr(u.updatedAt),
    ]),
  };
}

export default function UsersExportButton() {
  return (
    <CsvExportButton<ExportUser>
      collection="users"
      defaultSort="email"
      filenamePrefix="kullanicilar"
      translationPrefix="usersExport"
      buildTable={buildTable}
    />
  );
}
