"use client";

import Link from "next/link";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";

/** RFP §7 "userID comparison tables" — sidebar entry to /admin/access-matrix. NEW_VERTICAL_MAKER-only, same as LockedAccountsNavLink. */
export default function AccessMatrixNavLink() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { user } = useAuth();

  if ((user as { role?: string } | undefined)?.role !== ROLES.NEW_VERTICAL_MAKER) return null;

  return (
    <div className="nav-group nav-group--spaced">
      <div className="nav-group__content">
        <Link className="nav__link" href="/admin/access-matrix">
          <span className="nav__link-label">{t("accessMatrix.navLabel")}</span>
        </Link>
      </div>
    </div>
  );
}
