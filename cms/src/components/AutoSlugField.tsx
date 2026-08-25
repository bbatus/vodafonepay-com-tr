"use client";

import { useEffect } from "react";
import { useDocumentInfo, useField, useFormFields } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { turkishSlugify } from "@/lib/slugify";

/**
 * Follow-up 25.08: the sidebar half of the auto-slug change (server half is
 * hooks/autoSlug.ts). Two jobs:
 *
 * 1. Keep the form's own `slug` value filled as the editor types the title.
 *    This is not cosmetic — Payload runs field validation CLIENT-side before
 *    it ever submits, so a `required` slug the editor never sees would fail
 *    validation in the browser and the server hook would never get a chance
 *    to fill it in. Writing the value here is what makes "the editor never
 *    touches this field" actually work end to end.
 *
 * 2. Show what the resulting URL will be, read-only, with a plain-language
 *    note — the request was explicitly "kapalı alan olsun … kullanıcıdan
 *    istemesin", not "hide it entirely": the editor still needs to be able to
 *    see the address their page will live at.
 *
 * Once a document HAS a slug it's frozen (see autoSlug's doc comment — the
 * live URL must not silently change under an already-published campaign), so
 * this stops rewriting it and switches its note to say so.
 */
export default function AutoSlugField({
  sourceField = "title",
  urlPrefix = "",
}: {
  sourceField?: string;
  urlPrefix?: string;
}) {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { id } = useDocumentInfo();
  const { value, setValue } = useField<string>({ path: "slug" });
  const source = useFormFields(([fields]) => fields[sourceField]?.value as string | undefined);

  // A document that already existed when this screen opened has a live URL —
  // never rewrite it. A brand-new one (no id yet) tracks the title.
  const frozen = Boolean(id);

  useEffect(() => {
    if (frozen) return;
    const next = turkishSlugify(source ?? "");
    if (next !== value) setValue(next);
  }, [frozen, source, value, setValue]);

  const shown = typeof value === "string" && value.length > 0 ? value : "—";

  return (
    <div className="auto-slug field-type">
      <span className="field-label">{t("autoSlug.label")}</span>
      <output className="auto-slug__value">
        {urlPrefix}
        {shown}
      </output>
      <p className="field-description auto-slug__hint">{frozen ? t("autoSlug.frozenHint") : t("autoSlug.liveHint")}</p>
    </div>
  );
}
