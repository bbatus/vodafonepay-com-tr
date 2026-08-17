"use client";

import Link from "next/link";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";

/** RFP feedback 5.6: sidebar entry to /admin/locked-accounts — New Vertical Maker only. */
export default function LockedAccountsNavLink() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { user } = useAuth();

  if ((user as { role?: string } | undefined)?.role !== ROLES.NEW_VERTICAL_MAKER) return null;

  return (
    <div className="nav-group">
      <div className="nav-group__content">
        <Link className="nav__link" href="/admin/locked-accounts">
          <span className="nav__link-label">{t("lockedAccounts.navLabel")}</span>
        </Link>
      </div>
    </div>
  );
}
