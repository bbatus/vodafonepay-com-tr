"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { CONTENT_MANAGEMENT_TABS, tabLabel } from "@/lib/contentManagementTabs";

type Doc = {
  id: string | number;
  _status?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const PAGE_SIZE = 10;

/**
 * RFP feedback 3.10: a single page for browsing every content collection —
 * tabs across the top switch which collection's list is shown, instead of
 * navigating to a separate sidebar section per collection. Deliberately
 * NOT a reimplementation of the actual create/edit FORM (rich text,
 * uploads, relationships differ per collection and Payload's own edit view
 * already handles all of that correctly, draft/publish workflow included)
 * — "Yeni Ekle"/"Düzenle" hand off to Payload's existing document view.
 * Everything here talks to Payload's own REST API with the browser's
 * session cookie, so every collection's real access-control rules
 * (campaignsCreate, isNewVerticalMaker, etc.) apply exactly as they do
 * everywhere else in the admin — nothing is re-implemented or re-verified.
 */
export default function ContentManagementApp() {
  const { user } = useAuth();
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const role = (user as { role?: string } | undefined)?.role;

  const [activeSlug, setActiveSlug] = useState(CONTENT_MANAGEMENT_TABS[0].slug);
  const tab = useMemo(() => CONTENT_MANAGEMENT_TABS.find((tb) => tb.slug === activeSlug)!, [activeSlug]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      page: String(page),
      depth: "0",
      sort: "-updatedAt",
    });
    if (search.trim()) {
      params.set(`where[${tab.titleField}][contains]`, search.trim());
    }
    try {
      const res = await fetch(`/api/${tab.slug}?${params.toString()}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setDocs(data.docs ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalDocs(data.totalDocs ?? 0);
    } catch {
      setError(t("contentManagement.loadError"));
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, t]);

  useEffect(() => {
    startTransition(() => {
      load();
    });
  }, [load]);

  const switchTab = (slug: string) => {
    setActiveSlug(slug);
    setSearch("");
    setPage(1);
    setSelected(new Set());
  };

  const toggleSelected = (id: string | number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteOne = async (id: string | number) => {
    if (!window.confirm(t("contentManagement.confirmDelete"))) return;
    const res = await fetch(`/api/${tab.slug}/${id}`, { method: "DELETE", credentials: "same-origin" });
    if (!res.ok) {
      window.alert(t("contentManagement.deleteError"));
      return;
    }
    await load();
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(t("contentManagement.confirmBulkDelete"))) return;
    const results = await Promise.allSettled(
      Array.from(selected).map((id) => fetch(`/api/${tab.slug}/${id}`, { method: "DELETE", credentials: "same-origin" }))
    );
    const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)).length;
    if (failed > 0) window.alert(t("contentManagement.deleteError"));
    setSelected(new Set());
    await load();
  };

  const titleOf = (doc: Doc): string => {
    const value = doc[tab.titleField];
    return typeof value === "string" && value ? value : String(doc.id);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ margin: "0 0 1.5rem" }}>{t("contentManagement.title")}</h1>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderBottom: "1px solid var(--theme-elevation-150)", marginBottom: "1.5rem" }}>
        {CONTENT_MANAGEMENT_TABS.map((tb) => (
          <button
            key={tb.slug}
            type="button"
            onClick={() => switchTab(tb.slug)}
            style={{
              padding: "0.6rem 1rem",
              border: "none",
              borderBottom: tb.slug === activeSlug ? "2px solid var(--vf-red)" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontWeight: tb.slug === activeSlug ? 600 : 400,
              color: tb.slug === activeSlug ? "var(--theme-text)" : "var(--theme-elevation-500)",
            }}
          >
            {tabLabel(tb.slug, locale)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t("contentManagement.searchPlaceholder")}
          style={{
            padding: "0.5rem 0.75rem",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "var(--style-radius-m)",
            minWidth: 240,
          }}
        />
        <span style={{ fontSize: "0.8rem", color: "var(--theme-elevation-450)" }}>
          {totalDocs} {t("contentManagement.recordCount")}
        </span>
        <div style={{ flex: 1 }} />
        {selected.size > 0 && tab.canDelete(role) && (
          <button type="button" className="btn btn--style-secondary btn--size-medium" onClick={deleteSelected}>
            <span className="btn__content">
              <span className="btn__label">
                {t("contentManagement.deleteSelected")} ({selected.size})
              </span>
            </span>
          </button>
        )}
        {tab.canCreate(role) && (
          <Link href={`/admin/collections/${tab.slug}/create`} className="btn btn--style-primary btn--size-medium">
            <span className="btn__content">
              <span className="btn__label">{t("contentManagement.addNew")}</span>
            </span>
          </Link>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ margin: "1rem", color: "var(--theme-elevation-450)", fontSize: "0.875rem" }}>{t("contentManagement.loading")}</p>
        ) : error ? (
          <p style={{ margin: "1rem", color: "var(--theme-error-500)", fontSize: "0.875rem" }}>{error}</p>
        ) : docs.length === 0 ? (
          <p style={{ margin: "1rem", color: "var(--theme-elevation-450)", fontSize: "0.875rem" }}>{t("contentManagement.empty")}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--theme-elevation-100)" }}>
                <th style={{ width: 32, padding: "0.5rem 0.75rem" }} />
                <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--theme-elevation-450)", fontWeight: 500 }}>
                  {t("contentManagement.colTitle")}
                </th>
                {tab.hasDraft && (
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--theme-elevation-450)", fontWeight: 500 }}>
                    {t("contentManagement.colStatus")}
                  </th>
                )}
                <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--theme-elevation-450)", fontWeight: 500 }}>
                  {t("contentManagement.colUpdated")}
                </th>
                <th style={{ padding: "0.5rem 0.75rem" }} />
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: "1px solid var(--theme-elevation-50)" }}>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <input type="checkbox" checked={selected.has(doc.id)} onChange={() => toggleSelected(doc.id)} />
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <Link href={`/admin/collections/${tab.slug}/${doc.id}`} style={{ color: "var(--theme-text)", fontWeight: 500 }}>
                      {titleOf(doc)}
                    </Link>
                  </td>
                  {tab.hasDraft && (
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <span
                        style={{
                          padding: "0.15rem 0.5rem",
                          borderRadius: "var(--style-radius-s)",
                          fontSize: "0.75rem",
                          background: doc._status === "published" ? "var(--theme-success-100)" : "var(--theme-elevation-100)",
                          color: doc._status === "published" ? "var(--theme-success-600)" : "var(--theme-elevation-600)",
                        }}
                      >
                        {doc._status === "published" ? t("contentManagement.published") : t("contentManagement.draft")}
                      </span>
                    </td>
                  )}
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--theme-elevation-500)", whiteSpace: "nowrap" }}>
                    {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US") : "—"}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link href={`/admin/collections/${tab.slug}/${doc.id}`} style={{ marginRight: "0.75rem" }}>
                      {t("contentManagement.edit")}
                    </Link>
                    {tab.canDelete(role) && (
                      <button
                        type="button"
                        onClick={() => deleteOne(doc.id)}
                        style={{ background: "none", border: "none", color: "var(--theme-error-500)", cursor: "pointer", padding: 0, font: "inherit" }}
                      >
                        {t("contentManagement.delete")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "1rem" }}>
          <button
            type="button"
            className={`btn btn--style-secondary btn--size-small${page <= 1 ? " btn--disabled" : ""}`}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <span className="btn__content">
              <span className="btn__label">←</span>
            </span>
          </button>
          <span style={{ fontSize: "0.8rem", color: "var(--theme-elevation-500)" }}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className={`btn btn--style-secondary btn--size-small${page >= totalPages ? " btn--disabled" : ""}`}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <span className="btn__content">
              <span className="btn__label">→</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
