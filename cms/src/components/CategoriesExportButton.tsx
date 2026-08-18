"use client";

import { CsvExportButton, type CsvTable } from "./CsvExportButton";

type ExportCategory = {
  label?: string;
  scope?: string;
  slug?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * RFP follow-up — "kategoriler de csv olarak export alınabilmeli türkçe
 * karakter destekleyecek şekilde", same shared CsvExportButton every other
 * export uses (UTF-8 BOM, semicolon-delimited — see cms/src/lib/csv.ts).
 */
const HEADER = {
  tr: ["İsim", "Akış", "Slug", "Sıra", "Oluşturulma", "Güncellenme"],
  en: ["Label", "Scope", "Slug", "Order", "Created", "Updated"],
};

const SCOPE_LABELS = {
  tr: { campaign: "Kampanyalar", blog: "Blog", faq: "Sıkça Sorulan Sorular" },
  en: { campaign: "Campaigns", blog: "Blog", faq: "FAQ" },
};

function buildTable(docs: ExportCategory[], locale: "tr" | "en"): CsvTable {
  const scopeLabels = SCOPE_LABELS[locale] as Record<string, string>;
  return {
    header: HEADER[locale],
    rows: docs.map((c) => [
      c.label ?? "",
      (c.scope && scopeLabels[c.scope]) ?? c.scope ?? "",
      c.slug ?? "",
      c.order !== undefined ? String(c.order) : "",
      c.createdAt ? new Date(c.createdAt).toLocaleString("tr-TR") : "",
      c.updatedAt ? new Date(c.updatedAt).toLocaleString("tr-TR") : "",
    ]),
  };
}

export default function CategoriesExportButton() {
  return (
    <CsvExportButton<ExportCategory>
      collection="categories"
      defaultSort="order"
      depth={0}
      filenamePrefix="kategoriler"
      translationPrefix="categoriesExport"
      buildTable={buildTable}
    />
  );
}
