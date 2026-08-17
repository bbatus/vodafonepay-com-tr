"use client";

import { formatDateTr, richTextToPlainText } from "@/lib/csv";
import { CsvExportButton, type CsvTable } from "./CsvExportButton";

type Related = { id?: string | number; label?: string; email?: string } | string | number | null;

type ExportCampaign = {
  title?: string;
  slug?: string;
  description?: string;
  category?: Related;
  _status?: string;
  reviewStatus?: string;
  campaignStatus?: string;
  featured?: boolean;
  startDate?: string;
  endDate?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  body?: unknown;
  terms?: unknown;
  rejectionReason?: string;
  createdBy?: Related;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * RFP feedback 5.11 — "campaigns sayfasında da türkçe karakterleri
 * destekleyecek şekilde ne değerlerimiz varsa tüm sütunlarla birlikte csv".
 *
 * Fetched at `depth: 1` so `category` and `createdBy` arrive populated: an
 * export full of raw relationship ids would be unreadable in Excel, which is
 * the entire point of the file.
 *
 * The two richText fields (`body`, `terms`) ARE included, flattened to plain
 * text rather than dropped — an editor exporting "every column we have"
 * reasonably expects the campaign's actual body copy. They're the last two
 * columns so the scannable metadata stays visible without scrolling, and
 * newlines are collapsed (see richTextToPlainText) because a hard newline
 * inside a CSV cell renders as a broken multi-line row in some Excel builds.
 */
const HEADER = {
  tr: [
    "Başlık", "URL Adı", "Açıklama", "Kategori", "Yayın Durumu", "İnceleme Durumu", "Kampanya Durumu",
    "Öne Çıkan", "Başlangıç", "Bitiş", "Buton Yazısı", "Buton Linki", "SEO Başlığı", "SEO Açıklaması",
    "Red Sebebi", "Oluşturan", "Oluşturulma", "Güncellenme", "Gövde Metni", "Katılım Koşulları",
  ],
  en: [
    "Title", "URL Name", "Description", "Category", "Publish Status", "Review Status", "Campaign Status",
    "Featured", "Start", "End", "CTA Label", "CTA URL", "SEO Title", "SEO Description",
    "Rejection Reason", "Created By", "Created", "Updated", "Body", "Terms",
  ],
};

const LABELS = {
  tr: {
    yes: "Evet", no: "Hayır",
    published: "Yayında", draft: "Taslak",
    pending: "İncelemede", rejected: "Reddedildi",
    active: "Aktif", expired: "Süresi doldu",
  },
  en: {
    yes: "Yes", no: "No",
    published: "Published", draft: "Draft",
    pending: "Pending review", rejected: "Rejected",
    active: "Active", expired: "Expired",
  },
};

/** A depth:1 relationship comes back as an object; fall back to the raw id if it didn't populate. */
function relatedLabel(value: Related): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return value.label ?? value.email ?? String(value.id ?? "");
  return String(value);
}

function buildTable(docs: ExportCampaign[], locale: "tr" | "en"): CsvTable {
  const L = LABELS[locale];
  const bool = (v: boolean | undefined) => (v ? L.yes : L.no);
  const pick = (value: string | undefined, map: Record<string, string>) => (value ? (map[value] ?? value) : "");

  return {
    header: HEADER[locale],
    rows: docs.map((c) => [
      c.title ?? "",
      c.slug ?? "",
      c.description ?? "",
      relatedLabel(c.category ?? null),
      pick(c._status, { published: L.published, draft: L.draft }),
      pick(c.reviewStatus, { pending: L.pending, rejected: L.rejected }),
      pick(c.campaignStatus, { active: L.active, expired: L.expired }),
      bool(c.featured),
      formatDateTr(c.startDate),
      formatDateTr(c.endDate),
      c.ctaLabel ?? "",
      c.ctaUrl ?? "",
      c.seoTitle ?? "",
      c.seoDescription ?? "",
      c.rejectionReason ?? "",
      relatedLabel(c.createdBy ?? null),
      formatDateTr(c.createdAt),
      formatDateTr(c.updatedAt),
      richTextToPlainText(c.body),
      richTextToPlainText(c.terms),
    ]),
  };
}

export default function CampaignsExportButton() {
  return (
    <CsvExportButton<ExportCampaign>
      collection="campaigns"
      defaultSort="-createdAt"
      depth={1}
      filenamePrefix="kampanyalar"
      translationPrefix="campaignsExport"
      buildTable={buildTable}
    />
  );
}
