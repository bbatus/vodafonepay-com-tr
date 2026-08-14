"use client";

import { useState } from "react";
import { toast } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLE_OPTIONS } from "@/access/roles";

type ExportUser = {
  email?: string;
  role?: string;
  preferredLocale?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * RFP feedback: "users listesinde export alabilmeliydik excel ya da pdf ya
 * da word gibi. türkçe karakterleri destekleyecek şekilde." A real .xlsx
 * would need the `xlsx` (SheetJS) npm package, which as of this writing
 * carries two unpatched high-severity advisories (prototype pollution +
 * ReDoS) on the npm registry — SheetJS moved fixes to their own CDN outside
 * npm. That's incompatible with this repo's zero-known-vulnerability policy
 * (see AGENTS.md, R-13/R-14), so this exports CSV instead: semicolon-delimited
 * (the default list separator for Turkish-locale Excel) with a UTF-8 BOM,
 * which is what actually makes ç/ğ/ı/ö/ş/ü render correctly when Excel
 * double-click-opens the file — without a BOM, Excel guesses ANSI/Windows-1254
 * and mangles them.
 */
function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function roleLabel(role: string | undefined): string {
  return ROLE_OPTIONS.find((opt) => opt.value === role)?.label ?? role ?? "";
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("tr-TR");
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

      const header = ["E-posta", "Rol", "Dil Tercihi", "Oluşturulma", "Güncellenme"];
      const rows = docs.map((u) => [
        u.email ?? "",
        roleLabel(u.role),
        u.preferredLocale === "en" ? "English" : "Türkçe",
        formatDate(u.createdAt),
        formatDate(u.updatedAt),
      ]);
      const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(";")).join("\r\n");
      const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kullanicilar-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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
