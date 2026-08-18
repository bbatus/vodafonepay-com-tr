"use client";

import { formatDateTr, richTextToPlainText } from "@/lib/csv";
import { CsvExportButton, type CsvTable } from "./CsvExportButton";

type Related = { id?: string | number; label?: string } | string | number | null;

type ExportBlogPost = {
  title?: string;
  slug?: string;
  category?: Related;
  ctaLabel?: string;
  publishedDate?: string;
  postStatus?: string;
  _status?: string;
  seoTitle?: string;
  seoDescription?: string;
  body?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * RFP follow-up — "bloglar da alınmalı" (CSV export), same shared
 * CsvExportButton every other export uses. `body` is included flattened to
 * plain text, same reasoning as CampaignsExportButton's body/terms columns:
 * an editor exporting "every column we have" reasonably expects the
 * article's own copy, not just its metadata.
 */
const HEADER = {
  tr: ["Başlık", "URL Adı", "Kategori", "Buton Yazısı", "Yayın Tarihi", "Durum", "Yayın Durumu", "SEO Başlığı", "SEO Açıklaması", "Oluşturulma", "Güncellenme", "İçerik"],
  en: ["Title", "URL Name", "Category", "Button Label", "Published Date", "Status", "Publish Status", "SEO Title", "SEO Description", "Created", "Updated", "Body"],
};

const LABELS = {
  tr: { active: "Aktif", archived: "Arşivlendi", published: "Yayında", draft: "Taslak" },
  en: { active: "Active", archived: "Archived", published: "Published", draft: "Draft" },
};

function relatedLabel(value: Related): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return value.label ?? String(value.id ?? "");
  return String(value);
}

function buildTable(docs: ExportBlogPost[], locale: "tr" | "en"): CsvTable {
  const L = LABELS[locale];
  const pick = (value: string | undefined, map: Record<string, string>) => (value ? (map[value] ?? value) : "");

  return {
    header: HEADER[locale],
    rows: docs.map((p) => [
      p.title ?? "",
      p.slug ?? "",
      relatedLabel(p.category ?? null),
      p.ctaLabel ?? "",
      formatDateTr(p.publishedDate),
      pick(p.postStatus, { active: L.active, archived: L.archived }),
      pick(p._status, { published: L.published, draft: L.draft }),
      p.seoTitle ?? "",
      p.seoDescription ?? "",
      formatDateTr(p.createdAt),
      formatDateTr(p.updatedAt),
      richTextToPlainText(p.body),
    ]),
  };
}

export default function BlogPostsExportButton() {
  return (
    <CsvExportButton<ExportBlogPost>
      collection="blog-posts"
      defaultSort="-createdAt"
      depth={1}
      filenamePrefix="blog-yazilari"
      translationPrefix="blogPostsExport"
      buildTable={buildTable}
    />
  );
}
