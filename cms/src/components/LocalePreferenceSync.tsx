"use client";

import { useEffect } from "react";
import { useAuth } from "@payloadcms/ui";

/**
 * Keeps Payload's `payload-lng` cookie in step with the user's own
 * `preferredLocale` profile setting — the single place the admin UI language
 * is chosen (RFP feedback 5.7a).
 *
 * Payload's `payload-lng` cookie is NOT httpOnly (see @payloadcms/next's
 * `switchLanguageServerAction` — a plain `cookies().set()` with no httpOnly
 * flag), so this can read and write it directly.
 *
 * Previously this ran once per browser-tab session behind a sessionStorage
 * flag, so that a "temporary" language switch elsewhere in the chrome wasn't
 * fought on every navigation. There is no such switch any more — the Account
 * view replacement removed Payload's own Settings language block, and the
 * content-locale selector that used to sit in the header is gone with
 * `localization` — so the flag was guarding against a case that can no longer
 * happen, while letting the cookie and the saved preference drift apart until
 * the next login. Syncing unconditionally is both simpler and what the
 * profile setting promises.
 */
export default function LocalePreferenceSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const preferred = (user as { preferredLocale?: string } | undefined)?.preferredLocale;
    if (!preferred) return;

    const match = /(?:^|; )payload-lng=([^;]*)/.exec(document.cookie);
    const current = match ? decodeURIComponent(match[1]) : null;
    if (current === preferred) return;

    document.cookie = `payload-lng=${preferred}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }, [user]);

  return null;
}
