"use client";

import { useState } from "react";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLE_OPTIONS } from "@/access/roles";
import { buildCsv, downloadCsv, formatDateTr } from "@/lib/csv";

type ExportUser = {
  email?: string;
  role?: string;
  preferredLocale?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
};

/**
 * RFP feedback: "users listesinde export alabilmeliydik excel ya da pdf ya
 * da word gibi. türkçe karakterleri destekleyecek şekilde." A real .xlsx
 * would need the `xlsx` (SheetJS) npm package, which as of this writing
 * carries two unpatched high-severity advisories (prototype pollution +
 * ReDoS) on the npm registry — SheetJS moved fixes to their own CDN outside
 * npm. That's incompatible with this repo's zero-known-vulnerability policy
 * (see AGENTS.md, R-13/R-14), so this exports CSV instead — see lib/csv.ts
 * for why semicolon-delimited + UTF-8 BOM is what actually keeps
 * ç/ğ/ı/ö/ş/ü intact when Excel opens the file.
 */
function roleLabel(role: string | undefined): string {
  return ROLE_OPTIONS.find((opt) => opt.value === role)?.label ?? role ?? "";
}

export default function UsersExportButton() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/users?limit=5000&depth=0&sort=email", { credentials: "same-origin" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const docs: ExportUser[] = data.docs ?? [];

      const header = ["E-posta", "Rol", "Dil Tercihi", "Son Giriş", "Son Giriş IP", "Oluşturulma", "Güncellenme"];
      const rows = docs.map((u) => [
        u.email ?? "",
        roleLabel(u.role),
        u.preferredLocale === "en" ? "English" : "Türkçe",
        formatDateTr(u.lastLoginAt),
        u.lastLoginIp ?? "",
        formatDateTr(u.createdAt),
        formatDateTr(u.updatedAt),
      ]);
      const csv = buildCsv(header, rows);
      downloadCsv(csv, `kullanicilar-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(t("usersExport.done"));
    } catch {
      toast.error(t("usersExport.error"));
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
        <span className="btn__label">{exporting ? t("usersExport.exporting") : t("usersExport.button")}</span>
      </span>
    </button>
  );
}
