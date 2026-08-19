"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { NumberField, useField, useFormFields } from "@payloadcms/ui";
import type { NumberFieldClientProps } from "payload";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

/**
 * Purpose-built sibling to LiveOrderField, NOT a mode added to it — the two
 * fields want genuinely different behavior, not just different copy:
 *
 * 1. LiveOrderField's "suggested" is always `highest + 1` (sequential
 *    append), which is correct for `order`/`homepageOrder` (unbounded lists)
 *    but wrong here: footer is capped at `max` slots (assignFooterOrder,
 *    hooks/ordering.ts) and a record can be unchecked, freeing its slot —
 *    "highest + 1" would eventually suggest an out-of-range number even
 *    while an earlier slot sits open. This computes the first actually-free
 *    slot in 1..max instead, mirroring the server hook's own gap-fill logic.
 *
 * 2. RFP follow-up: LiveOrderField deliberately requires a manual "use this
 *    number" click — auto-filling was ruled out there because a client-set
 *    value would look indistinguishable from one the editor typed, silently
 *    defeating assignNextOrder's "respect an explicit value" guard. That
 *    concern doesn't apply here: this field ONLY auto-fills when it's
 *    currently EMPTY (a fresh "Footer'da Göster" check), never overwrites a
 *    value that's already set — editing an already-flagged record with a
 *    saved footerOrder is a no-op on load. The editor can still freely
 *    retype it afterward; this just removes the extra click for the
 *    overwhelmingly common case (checking the box on a new record).
 */
type FooterOrderFieldProps = NumberFieldClientProps & {
  collection: string;
  watchPath: string;
  max: number;
};

export default function FooterOrderField(props: FooterOrderFieldProps) {
  const { collection, watchPath, max, field, path } = props;
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { value, setValue } = useField<number>({ path });
  const watchedValue = useFormFields(([fields]) => fields[watchPath]?.value);

  const [info, setInfo] = useState<{ count: number; freeSlot: number | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const valueRef = useRef(value);
  const autoFilledRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!watchedValue) {
      startTransition(() => setInfo(null));
      // Reset so unchecking then re-checking the box can auto-fill again.
      autoFilledRef.current = false;
      return;
    }
    let cancelled = false;
    startTransition(() => setLoading(true));
    const params = new URLSearchParams({
      depth: "0",
      limit: String(max),
      [`where[${watchPath}][equals]`]: "true",
    });
    fetch(`/api/${collection}?${params.toString()}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data: { totalDocs?: number; docs?: Record<string, unknown>[] }) => {
        if (cancelled) return;
        const used = new Set(
          (data.docs ?? []).map((d) => d[path]).filter((n): n is number => typeof n === "number")
        );
        let freeSlot: number | null = null;
        for (let i = 1; i <= max; i += 1) {
          if (!used.has(i)) {
            freeSlot = i;
            break;
          }
        }
        setInfo({ count: data.totalDocs ?? 0, freeSlot });
        if (!autoFilledRef.current && !valueRef.current && freeSlot !== null) {
          setValue(freeSlot);
          autoFilledRef.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) setInfo(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setValue is stable (Payload's useField), and valueRef sidesteps needing `value` here.
  }, [collection, watchPath, path, max, watchedValue]);

  return (
    <div>
      <NumberField field={field} path={path} />
      {loading && <p className="field-description">{t("footerOrderField.loading")}</p>}
      {!loading && info && (
        <p className="field-description">
          {info.freeSlot === null
            ? t("footerOrderField.full").replaceAll("{max}", String(max))
            : t("footerOrderField.count").replaceAll("{count}", String(info.count)).replaceAll("{max}", String(max))}
        </p>
      )}
    </div>
  );
}
