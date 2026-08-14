"use client";

import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

/**
 * RFP feedback 3.4: "Forgot password kapalı olmalı — zaten LDAP ile giriş
 * yapılacak" (LDAP wiring is a stated future plan, not built here — see
 * docs/RFP-OPEN-ITEMS.md). Self-service password reset makes no sense once
 * identity is LDAP-owned, so it's disabled now rather than left dangling.
 * Overrides Payload's built-in `forgot`/`reset` views entirely (not just
 * the link — the actual routes are replaced too, so this can't be bypassed
 * by guessing the URL).
 */
export default function ForgotPasswordDisabled() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto", padding: "0 1rem", textAlign: "center" }}>
      <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{t("forgotPasswordDisabled.title")}</p>
      <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.9rem" }}>{t("forgotPasswordDisabled.body")}</p>
    </div>
  );
}
