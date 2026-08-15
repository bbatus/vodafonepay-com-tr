"use client";

import React from "react";
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

  // RFP feedback 5.9a: the sessionStorage flag this used to clear is gone —
  // LocalePreferenceSync now syncs the language cookie unconditionally, so
  // there's no per-session state left for a logout→login to reset.
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
