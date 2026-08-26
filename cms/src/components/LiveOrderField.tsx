"use client";

import { startTransition, useEffect, useState } from "react";
import { NumberField, useField, useFormFields } from "@payloadcms/ui";
import type { NumberFieldClientProps } from "payload";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

/**
 * RFP follow-up (§3.1): `assignNextOrder`/`assignNextHomepageOrder`
 * (hooks/ordering.ts, FaqItems.ts) already auto-number a blank `order` field
 * server-side, and `min: 1` already hard-blocks 0/negative values server-side
 * (verified live via a raw PATCH). What was missing was purely the editor
 * *seeing* that before saving — how many questions are already in the
 * category they just picked, and what number would come next. This wraps
 * Payload's own `NumberField` (same input, same validation) and adds that as
 * a live line underneath, updating as `watchPath` changes.
 *
 * Deliberately does NOT auto-fill the value on watchPath change — an
 * automatic default here would reproduce the exact bug `order`'s own field
 * comment describes (a client-set value looking indistinguishable from one
 * the editor typed, so the "respect an explicit value" guard in the
 * beforeChange hook silently stops auto-numbering). The suggested number is
 * only ever written via the explicit "Bu numarayı kullan" click.
 *
 * Two concurrent editors creating in the same category at once can still
 * both see (and use) the same suggested number — the last save wins the
 * `order` value, same race that already exists without this component. Not
 * solved here; noted as a known limitation in the round report.
 */

type Mode = "relationship" | "boolean";

type LiveOrderFieldProps = NumberFieldClientProps & {
  collection: string;
  watchPath: string;
  mode: Mode;
};

export default function LiveOrderField(props: LiveOrderFieldProps) {
  const { collection, watchPath, mode, field, path } = props;
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { value, setValue } = useField<number>({ path });
  const watchedValue = useFormFields(([fields]) => fields[watchPath]?.value);

  const [info, setInfo] = useState<{ count: number; suggested: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // A boolean group field ("is this in the footer?") collapses to a single
    // group key when checked, and to "no group" when not.
    const booleanGroupValue = watchedValue ? "true" : null;
    const groupValue =
      mode === "boolean" ? booleanGroupValue : (watchedValue as string | number | null | undefined);
    if (!groupValue) {
      startTransition(() => setInfo(null));
      return;
    }
    let cancelled = false;
    startTransition(() => setLoading(true));
    const params = new URLSearchParams({
      depth: "0",
      limit: "1",
      sort: `-${path}`,
      [`where[${watchPath}][equals]`]: String(groupValue),
    });
    fetch(`/api/${collection}?${params.toString()}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data: { totalDocs?: number; docs?: Record<string, unknown>[] }) => {
        if (cancelled) return;
        const highest = data.docs?.[0]?.[path] as number | undefined;
        setInfo({ count: data.totalDocs ?? 0, suggested: typeof highest === "number" ? highest + 1 : 1 });
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
  }, [collection, watchPath, path, mode, watchedValue]);

  return (
    <div>
      <NumberField field={field} path={path} />
      {loading && <p className="field-description">{t("liveOrder.loading")}</p>}
      {!loading && info && (
        <p className="field-description">
          {t("liveOrder.count").replace("{count}", String(info.count))}
          {" — "}
          {t("liveOrder.suggested").replace("{suggested}", String(info.suggested))}
          {value !== info.suggested && (
            <>
              {" "}
              <button
                type="button"
                className="live-order-field__use-suggested"
                onClick={() => setValue(info.suggested)}
              >
                {t("liveOrder.useSuggested").replace("{suggested}", String(info.suggested))}
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
