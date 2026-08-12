"use client";

import { useTranslation } from "@payloadcms/ui";

export type AdminLocale = "tr" | "en";

/**
 * Every custom admin component (ReorderWidget, HelpButton, and anything
 * added after them) must render in whichever language the editor picked
 * for the admin UI — not hardcode Turkish. Payload's own `useTranslation`
 * already knows the current admin language (`i18n.language`, driven by the
 * `payload-lng` cookie); this just narrows it to the two locales this repo
 * actually supports, since Payload's type allows any AcceptedLanguages
 * value even though only tr/en are registered in payload.config.ts.
 */
export function useAdminLocale(): AdminLocale {
  const { i18n } = useTranslation();
  return i18n.language === "en" ? "en" : "tr";
}
