"use client";

import Link from "next/link";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

/** RFP follow-up: sidebar entry point to /admin/fees-and-limits — the single combined Ücretler ve Limitler page. */
export default function FeesAndLimitsNavLink() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);

  return (
    <div className="nav-group" style={{ marginTop: "0.5rem" }}>
      <div className="nav-group__content">
        <Link className="nav__link" href="/admin/fees-and-limits">
          <span className="nav__link-label">{t("feesAndLimits.navLabel")}</span>
        </Link>
      </div>
    </div>
  );
}
