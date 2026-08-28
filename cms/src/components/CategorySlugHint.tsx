"use client";

import { useEffect, useState } from "react";
import { useAdminLocale } from "./useAdminLocale";

/**
 * Lists the category slugs that are actually valid for a block's `category`
 * field, right under it.
 *
 * A block's category is a free-text slug. Typing one that doesn't exist used
 * to save silently and the block then rendered nothing (found live: an FAQ
 * block with category "testtttt" left an invisible gap). `categoryExistsValidate`
 * in Pages.ts now refuses that save — but Payload only surfaces the FIELD PATH
 * from a nested block's validate, not the message body, so the "here are the
 * valid ones" half of the fix cannot reach the editor through the error.
 * It goes here instead, where they are already looking.
 */
const STRINGS = {
  tr: {
    loading: "Kategoriler yükleniyor…",
    available: "Bu akıştaki kategoriler:",
    none: "Bu akışta henüz kategori yok — boş bırakın ya da önce Kategoriler'den bir tane oluşturun.",
    hint: "Boş bırakırsanız hepsi listelenir.",
  },
  en: {
    loading: "Loading categories…",
    available: "Categories in this flow:",
    none: "No categories in this flow yet — leave empty, or create one in Categories first.",
    hint: "Leave empty to list them all.",
  },
};

export default function CategorySlugHint({ scope }: { scope: "campaign" | "blog" | "faq" }) {
  const t = STRINGS[useAdminLocale()];
  const [slugs, setSlugs] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/categories?depth=0&limit=100&where[scope][equals]=${scope}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs?: { slug?: string }[] }) => {
        if (cancelled) return;
        setSlugs((d.docs ?? []).map((c) => c.slug).filter((s): s is string => Boolean(s)));
      })
      .catch(() => {
        // A failed lookup must not look like "there are no categories" — the
        // field still validates server-side either way.
        if (!cancelled) setSlugs(null);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  if (slugs === null) return <div style={{ fontSize: 12, opacity: 0.6 }}>{t.loading}</div>;

  return (
    <div style={{ fontSize: 12, marginTop: -8, marginBottom: 8 }}>
      {slugs.length === 0 ? (
        <span style={{ opacity: 0.75 }}>{t.none}</span>
      ) : (
        <>
          <span style={{ opacity: 0.75 }}>{t.available} </span>
          {slugs.map((s, i) => (
            <span key={s}>
              <code
                style={{
                  background: "var(--theme-elevation-100)",
                  padding: "1px 5px",
                  borderRadius: 3,
                }}
              >
                {s}
              </code>
              {i < slugs.length - 1 ? " " : ""}
            </span>
          ))}
          <span style={{ opacity: 0.6 }}> · {t.hint}</span>
        </>
      )}
    </div>
  );
}
