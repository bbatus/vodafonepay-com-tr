"use client";

import React, { useEffect } from "react";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

/**
 * RFP feedback 3.12: replaces the previous 3-feature-card layout with one
 * large bold headline + a smaller regular-weight subheadline, both in white,
 * directly under the logo — matching the requested "one big bold line, one
 * smaller line below it" style instead of 3 separate callouts.
 */
export default function LoginBrandPanel() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);

  // RFP feedback 3.5: clears LocalePreferenceSync.tsx's per-session flag so
  // a logout→login in the same browser tab re-applies the user's stored
  // preferredLocale instead of skipping it (sessionStorage otherwise
  // survives across a logout that doesn't close the tab).
  useEffect(() => {
    if (typeof window !== "undefined") sessionStorage.removeItem("vf-locale-synced");
  }, []);

  return (
    <div className="vf-login-panel">
      <div className="vf-login-panel__top">
        <div className="vf-login-panel__badge">
          <img src="/admin-icon.svg" alt="" width={40} height={40} />
        </div>
        <h1 className="vf-login-panel__title">Vodafone Pay</h1>
        <p className="vf-login-panel__tagline">{t("loginBrandPanel.tagline")}</p>
      </div>

      <div className="vf-login-panel__hero">
        <p className="vf-login-panel__hero-headline">{t("loginBrandPanel.headline")}</p>
        <p className="vf-login-panel__hero-subheadline">{t("loginBrandPanel.subheadline")}</p>
      </div>

      <p className="vf-login-panel__status">vodafonepay.com.tr · CMS</p>
    </div>
  );
}
