"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDocumentInfo } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

type UsageHit = { collectionSlug: string; collectionLabel: string; docId: string | number; docTitle: string };

/**
 * RFP feedback C2: automatic "Kullanıldığı yerler" list, alongside the
 * manual `usageNote` field. Only covers TOP-LEVEL upload/relationTo:"media"
 * fields (see the list below) — several other collections reference media
 * from inside `blocks`/`array` fields (e.g. Pages.layout blocks), which
 * Payload's REST `where` can't cleanly target with a flat query, so those
 * are deliberately left out rather than silently under- or over-matching.
 */
const MEDIA_REFERENCING_FIELDS: { collectionSlug: string; field: string; collectionLabel: string; titleField: string }[] = [
  { collectionSlug: "campaigns", field: "image", collectionLabel: "Kampanyalar", titleField: "title" },
  { collectionSlug: "blog-posts", field: "coverImage", collectionLabel: "Blog Yazıları", titleField: "title" },
  { collectionSlug: "content-blocks", field: "image", collectionLabel: "İçerik Blokları", titleField: "title" },
  { collectionSlug: "feature-cards", field: "icon", collectionLabel: "Özellik Kartları", titleField: "title" },
  { collectionSlug: "step-cards", field: "image", collectionLabel: "Adım Kartları", titleField: "text" },
  { collectionSlug: "product-heroes", field: "image", collectionLabel: "Ürün Vitrinleri", titleField: "page" },
  { collectionSlug: "representatives", field: "qrCode", collectionLabel: "Temsilciler", titleField: "businessName" },
  { collectionSlug: "page-meta", field: "ogImage", collectionLabel: "Sayfa SEO", titleField: "pageKey" },
  { collectionSlug: "pages", field: "ogImage", collectionLabel: "Sayfalar", titleField: "title" },
  { collectionSlug: "users", field: "avatar", collectionLabel: "Kullanıcılar", titleField: "email" },
];

export default function MediaUsageField() {
  const { id } = useDocumentInfo();
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [hits, setHits] = useState<UsageHit[] | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    Promise.all(
      MEDIA_REFERENCING_FIELDS.map(async ({ collectionSlug, field, collectionLabel, titleField }) => {
        const params = new URLSearchParams({
          [`where[${field}][equals]`]: String(id),
          limit: "10",
          depth: "0",
        });
        try {
          const res = await fetch(`/api/${collectionSlug}?${params.toString()}`, { credentials: "same-origin" });
          if (!res.ok) return [];
          const data = (await res.json()) as { docs?: Record<string, unknown>[] };
          return (data.docs ?? []).map((doc): UsageHit => {
            const docId = doc.id as string | number;
            return {
              collectionSlug,
              collectionLabel,
              docId,
              docTitle: (doc[titleField] as string | undefined) ?? String(docId),
            };
          });
        } catch {
          return [];
        }
      })
    ).then((results) => {
      if (!cancelled) setHits(results.flat());
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  let body: React.ReactNode;
  if (!id) {
    body = null;
  } else if (hits === null) {
    body = <p className="field-description">{t("mediaUsage.loading")}</p>;
  } else if (hits.length === 0) {
    body = <p className="field-description">{t("mediaUsage.empty")}</p>;
  } else {
    body = (
      <ul className="media-usage-field__list">
        {hits.map((hit) => (
          <li key={`${hit.collectionSlug}-${hit.docId}`}>
            <Link href={`/admin/collections/${hit.collectionSlug}/${hit.docId}`}>
              {hit.collectionLabel}: {hit.docTitle}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  if (!id) return null;

  return (
    <div className="media-usage-field">
      <span className="field-label">{t("mediaUsage.title")}</span>
      {body}
    </div>
  );
}
