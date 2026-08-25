"use client";

import { startTransition, useEffect, useState } from "react";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

type PeekCategory = { id: string | number; label?: string; slug?: string; order?: number };

/**
 * Follow-up 25.08: "dropdown'dan seçti ya kampanyalar blog vs seçtiği anda
 * alta mevcutlar sadece bilgi amaçlı gösterilebilir kullanıcı memnuniyeti
 * için."
 *
 * Purely informational — it never writes anything. Its job is to answer the
 * question an editor actually has at that moment ("does a category like this
 * already exist in this flow, or am I about to create a duplicate?") without
 * making them open the list in another tab and filter it by hand.
 *
 * Scoped to the flow currently selected in the `scope` dropdown and refetched
 * whenever that changes.
 */
export default function CategoryScopePeek() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { id } = useDocumentInfo();
  const scope = useFormFields(([fields]) => fields.scope?.value as string | undefined);
  const [items, setItems] = useState<PeekCategory[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scope) return;
    let cancelled = false;
    startTransition(() => {
      setItems(null);
      setFailed(false);
    });
    fetch(`/api/categories?depth=0&limit=100&sort=order&where[scope][equals]=${encodeURIComponent(scope)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data: { docs?: PeekCategory[] }) => {
        if (!cancelled) setItems(data.docs ?? []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  if (!scope) return null;

  // On an existing category, exclude itself — "already in this flow" is about
  // the OTHER ones, and listing the row you're editing reads as a duplicate.
  const others = (items ?? []).filter((c) => String(c.id) !== String(id ?? ""));

  let body: React.ReactNode;
  if (failed) {
    body = <p className="field-description">{t("categoryPeek.error")}</p>;
  } else if (items === null) {
    body = <p className="field-description">{t("categoryPeek.loading")}</p>;
  } else if (others.length === 0) {
    body = <p className="field-description">{t("categoryPeek.empty")}</p>;
  } else {
    body = (
      <ul className="category-peek__list">
        {others.map((c) => (
          <li key={c.id} className="category-peek__item">
            <span className="category-peek__label">{c.label ?? `#${c.id}`}</span>
            <code className="category-peek__slug">{c.slug}</code>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="category-peek">
      <span className="field-label">
        {t("categoryPeek.title")}
        {items !== null && !failed ? ` (${others.length})` : ""}
      </span>
      {body}
      <p className="field-description">{t("categoryPeek.note")}</p>
    </div>
  );
}
