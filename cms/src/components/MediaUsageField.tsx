"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDocumentInfo } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { REFERENCE_MAP } from "@/hooks/referentialIntegrity";
import { COLLECTION_LABELS } from "@/lib/collectionLabels";

type UsageHit = { collectionSlug: string; docId: string | number; docTitle: string };

/**
 * RFP feedback C2: automatic "Kullanıldığı yerler" list, alongside the manual
 * `usageNote` field.
 *
 * Reads the SAME reference map the delete guard uses
 * (hooks/referentialIntegrity.ts) so this panel and the "can't delete, still
 * in use" error can never disagree about what counts as a usage — previously
 * this component carried its own hand-maintained copy of the field list, with
 * hardcoded Turkish collection labels that never switched to English.
 *
 * That old copy also skipped Pages' `blocks` fields on the assumption that
 * Payload's flat `where` couldn't target them. Verified live that it can:
 * `where[layout.image][equals]=N` and `where[layout.logos.logo][equals]=N`
 * both match correctly through the polymorphic blocks array and the array
 * nested inside it — so those references are now covered here too.
 */
const MEDIA_SOURCES = REFERENCE_MAP.media;

export default function MediaUsageField() {
  const { id } = useDocumentInfo();
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [hits, setHits] = useState<UsageHit[] | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    Promise.all(
      MEDIA_SOURCES.map(async ({ collection, path, titleField }) => {
        const params = new URLSearchParams({
          [`where[${path}][equals]`]: String(id),
          limit: "10",
          depth: "0",
        });
        try {
          const res = await fetch(`/api/${collection}?${params.toString()}`, { credentials: "same-origin" });
          if (!res.ok) return [];
          const data = (await res.json()) as { docs?: Record<string, unknown>[] };
          return (data.docs ?? []).map((doc): UsageHit => {
            const docId = doc.id as string | number;
            return {
              collectionSlug: collection,
              docId,
              docTitle: (doc[titleField] as string | undefined) ?? String(docId),
            };
          });
        } catch {
          return [];
        }
      })
    ).then((results) => {
      if (cancelled) return;
      // The same page can match through more than one path (e.g. a hero image
      // that's also the OG image) — show it once.
      const flat = results.flat();
      const seen = new Set<string>();
      setHits(
        flat.filter((hit) => {
          const key = `${hit.collectionSlug}-${String(hit.docId)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
      );
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return null;

  let body: React.ReactNode;
  if (hits === null) {
    body = <p className="field-description">{t("mediaUsage.loading")}</p>;
  } else if (hits.length === 0) {
    body = <p className="field-description">{t("mediaUsage.empty")}</p>;
  } else {
    body = (
      <>
        <ul className="media-usage-field__list">
          {hits.map((hit) => (
            <li key={`${hit.collectionSlug}-${String(hit.docId)}`}>
              <Link href={`/admin/collections/${hit.collectionSlug}/${String(hit.docId)}`}>
                {COLLECTION_LABELS[hit.collectionSlug]?.[locale] ?? hit.collectionSlug}: {hit.docTitle}
              </Link>
            </li>
          ))}
        </ul>
        <p className="field-description">{t("mediaUsage.inUseNote")}</p>
      </>
    );
  }

  return (
    <div className="media-usage-field">
      <span className="field-label">{t("mediaUsage.title")}</span>
      {body}
    </div>
  );
}
