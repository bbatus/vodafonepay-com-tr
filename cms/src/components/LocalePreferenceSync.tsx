"use client";

import { useEffect } from "react";
import { useAuth } from "@payloadcms/ui";

const SYNC_FLAG = "vf-locale-synced";

/**
 * RFP feedback 3.5: "kişi başta tr olsun, üstten geçici EN'e geçebilir ama
 * profilden EN yaparsa TR yapana kadar HER LOGIN'de EN açılsın." Payload's
 * `payload-lng` cookie is NOT httpOnly (see @payloadcms/next's
 * switchLanguageServerAction — a plain `cookies().set()` with no httpOnly
 * flag), so this can read/write it directly. Runs once per browser tab
 * session (sessionStorage flag, cleared on the login page — see
 * LoginBrandPanel.tsx) so a mid-session topbar language switch isn't
 * fought on every page navigation, only re-applied on the next real login.
 */
export default function LocalePreferenceSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (sessionStorage.getItem(SYNC_FLAG)) return;

    const preferred = (user as { preferredLocale?: string } | undefined)?.preferredLocale;
    if (!preferred) return;
    sessionStorage.setItem(SYNC_FLAG, "1");

    const match = document.cookie.match(/(?:^|; )payload-lng=([^;]*)/);
    const current = match ? decodeURIComponent(match[1]) : null;
    if (current !== preferred) {
      document.cookie = `payload-lng=${preferred}; path=/; max-age=${60 * 60 * 24 * 365}`;
      window.location.reload();
    }
  }, [user]);

  return null;
}
