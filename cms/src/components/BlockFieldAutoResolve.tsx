"use client";

import { useEffect, useRef } from "react";
import { useForm, useFormFields } from "@payloadcms/ui";

/**
 * Works around a known upstream Payload bug (payloadcms/payload#9567,
 * confirmed still present in 3.88.0 — 30.08.2026, `addFieldRow` marks a new
 * row `isLoading: true` in `fieldReducer.js`, but nothing reliably clears it
 * for that row's own fields until a FULL form-state refetch happens): a
 * block added through "+ Layout Ekle" sometimes renders with none of its
 * own fields — no heading input, no image picker, nothing between the block
 * header and the next control.
 *
 * The only manual workaround found (and confirmed live, same session):
 * clicking "Onaya Gönder" / "Taslağı Kaydet" right after adding the block.
 * That works because Payload's own SaveDraftButton submit round-trips
 * through `getFormState` with `renderAllFields: true`, which is the one
 * path that actually resolves a brand-new row's field schema — the partial,
 * debounced refresh that runs on ordinary typing does not.
 *
 * This automates exactly that refetch, without an actual save: `reset(data)`
 * calls the very same `getFormState` request (`renderAllFields: true`) that
 * the initial edit-view load and SaveDraftButton use, seeded with the form's
 * OWN current data via `getData()` — so nothing the editor already typed
 * elsewhere is lost, and nothing is persisted to the document.
 *
 * Scoped to one field path (passed via clientProps) rather than the whole
 * form: only an INCREASE in that field's own row count triggers a refetch,
 * so typing in an unrelated field, reordering rows, or removing a row never
 * does. The 600ms delay roughly matches BlockRow's own `useThrottledValue`
 * shimmer window (500ms), so from the editor's side a new block shows its
 * normal loading shimmer and then simply resolves — not an empty block that
 * visibly refreshes a moment later.
 */
export default function BlockFieldAutoResolve({ path }: { path: string }) {
  const { getData, reset } = useForm();
  const rowCount = useFormFields(([fields]) => (fields as Record<string, { rows?: unknown[] }>)[path]?.rows?.length ?? 0);
  const prevRowCount = useRef<number | null>(null);

  useEffect(() => {
    const previous = prevRowCount.current;
    prevRowCount.current = rowCount;
    if (previous === null || rowCount <= previous) {
      return;
    }
    const timer = setTimeout(() => {
      void reset(getData());
    }, 600);
    return () => clearTimeout(timer);
  }, [rowCount, getData, reset]);

  return null;
}
