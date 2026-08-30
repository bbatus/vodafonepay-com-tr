"use client";

import { useEffect, useState } from "react";
import { useField } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";

/**
 * Follow-up 30.08, from the user: a block's `category` field was free text
 * with a validator (`categoryExistsValidate`) and a live hint list underneath
 * it (`CategorySlugHint`) — "hem kategoriye bağlanması eksik yani dropdown
 * olarak açılması lazımken placeholder şeklinde açılıyor". Typing a slug by
 * hand and getting told after the fact whether it was right is strictly
 * worse than picking from a real list, so this replaces both the text input
 * and the hint with one dropdown sourced live from the Categories
 * collection, scoped the same way the validator already was.
 *
 * `options` for a plain Payload `select` field must be static at config-build
 * time — categories are edited at runtime — so this stays a `type: "text"`
 * field underneath and only the rendered INPUT changes, via
 * `admin.components.Field`. The stored value is still the plain slug string,
 * unchanged from before: no schema migration, no site-side fetch code
 * changes needed (`getFaqItems`/`getCampaigns`/`getBlogPosts` still filter by
 * `category.slug`).
 */
const STRINGS = {
  tr: { label: "Kategori", all: "— Tümü —", loading: "Kategoriler yükleniyor…", empty: "Bu akışta henüz kategori yok." },
  en: { label: "Category", all: "— All —", loading: "Loading categories…", empty: "No categories in this flow yet." },
};

const DESCRIPTION: Record<"campaign" | "blog" | "faq", { tr: string; en: string }> = {
  faq: {
    tr: "Sadece BELİRLİ bir kategorideki soruları göstermek için seçin. \"Tümü\" seçiliyse SSS akışındaki tüm sorular gelir.",
    en: "Pick one to show only that category's questions. \"All\" shows every question in the FAQ flow.",
  },
  campaign: {
    tr: "Sadece BELİRLİ bir kategorideki kampanyaları göstermek için seçin. \"Tümü\" seçiliyse tüm aktif kampanyalar gelir.",
    en: "Pick one to show only that category's campaigns. \"All\" shows every active campaign.",
  },
  blog: {
    tr: "Sadece BELİRLİ bir kategorideki yazıları göstermek için seçin. \"Tümü\" seçiliyse tüm yazılar gelir.",
    en: "Pick one to show only that category's posts. \"All\" shows every post.",
  },
};

type CategoryOption = { slug: string; label: string };

export default function CategorySlugSelect({ path, scope }: { path: string; scope: "campaign" | "blog" | "faq" }) {
  const { value, setValue } = useField<string>({ path });
  const locale = useAdminLocale();
  const t = STRINGS[locale];
  const [options, setOptions] = useState<CategoryOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/categories?depth=0&limit=100&where[scope][equals]=${scope}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs?: { slug?: string; label?: string }[] }) => {
        if (cancelled) return;
        setOptions(
          (d.docs ?? [])
            .filter((c): c is { slug: string; label?: string } => Boolean(c.slug))
            .map((c) => ({ slug: c.slug, label: c.label || c.slug }))
        );
      })
      .catch(() => {
        // A failed lookup must not silently look like "no categories exist" —
        // fall back to an empty (but non-null) list so the select still shows
        // "Tümü" and stays usable; the field's own validator still runs
        // server-side regardless.
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={path}>
        {t.label}
      </label>
      <select
        id={path}
        className="select-input"
        value={value ?? ""}
        disabled={options === null}
        onChange={(e) => setValue(e.target.value || null)}
      >
        <option value="">{t.all}</option>
        {(options ?? []).map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label} ({o.slug})
          </option>
        ))}
      </select>
      <p className="field-description">
        {options === null
          ? t.loading
          : options.length === 0
            ? t.empty
            : DESCRIPTION[scope][locale]}
      </p>
    </div>
  );
}
