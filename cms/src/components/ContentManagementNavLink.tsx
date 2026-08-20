"use client";

import Link from "next/link";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

/** RFP feedback 3.10: sidebar entry point to /admin/content-management — visible to every role. */
export default function ContentManagementNavLink() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);

  return (
    <div className="nav-group nav-group--spaced">
      <div className="nav-group__content">
        <Link className="nav__link" href="/admin/content-management">
          <span className="nav__link-label">{t("contentManagement.navLabel")}</span>
        </Link>
      </div>
    </div>
  );
}
