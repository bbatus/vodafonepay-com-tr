"use client";

import { useCallback, useEffect, useState } from "react";
import { TRANSLATION_DEFAULTS } from "@/lib/translationDefaults";
import type { AdminLocale } from "./useAdminLocale";

type Row = { key: string; tr: string; en: string };

// Module-level cache: one fetch per admin session, shared by every
// component that calls this hook, not per-component.
let cache: Record<string, Row> | null = null;
let inFlight: Promise<Record<string, Row>> | null = null;

async function loadTranslations(): Promise<Record<string, Row>> {
  if (cache) return cache;
  if (inFlight !== null) return inFlight;
  inFlight = fetch("/api/translations?limit=500&depth=0", { credentials: "same-origin" })
    .then((res) => (res.ok ? res.json() : { docs: [] }))
    .then((data: { docs?: Row[] }) => {
      const map: Record<string, Row> = {};
      for (const row of data.docs ?? []) map[row.key] = row;
      cache = map;
      return map;
    })
    .catch(() => ({}) as Record<string, Row>);
  return inFlight;
}

/**
 * RFP feedback 3.2: DB-backed override for a custom component's UI strings.
 * `TRANSLATION_DEFAULTS` (and whatever `defaults` the caller passes — always
 * the same object) render immediately on first paint; once the one-time
 * `/api/translations` fetch resolves, any key that has a DB row re-renders
 * with the DB-editable value. A component never breaks if the DB has no row
 * for a key or the fetch fails — it just keeps showing the code default.
 *
 * The returned `t` is wrapped in `useCallback` (stable across renders
 * unless `rows`/`locale` actually change) — confirmed live this matters:
 * an early version returned a plain inline function, and a consumer that
 * put `t` in a `useEffect`/`useCallback` dependency array (ContentManagementApp.tsx)
 * got a new `t` every render, which re-ran the effect, which set state,
 * which re-rendered, forever — an infinite fetch loop that took down the
 * browser tab with net::ERR_INSUFFICIENT_RESOURCES.
 */
export function useDbStrings(locale: AdminLocale) {
  const [rows, setRows] = useState<Record<string, Row> | null>(cache);

  useEffect(() => {
    let cancelled = false;
    loadTranslations().then((loaded) => {
      if (!cancelled) setRows(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return useCallback(
    (key: string): string => {
      const dbValue = rows?.[key]?.[locale];
      if (dbValue) return dbValue;
      return TRANSLATION_DEFAULTS[key]?.[locale] ?? key;
    },
    [rows, locale]
  );
}
