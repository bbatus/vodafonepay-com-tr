"use client";

import Link from "next/link";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";

/**
 * RFP feedback 3.11: sidebar entry point to /admin/waiting-approvals.
 * Growth Maker never approves/rejects anything, so it doesn't get the link
 * (the view itself also blocks it server-side — this just avoids a
 * dead-end link for a role that would only ever see "no access" there).
 */
export default function WaitingApprovalsNavLink() {
  const { user } = useAuth();
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const role = (user as { role?: string } | undefined)?.role;

  if (role === ROLES.GROWTH_MAKER) return null;

  return (
    <div className="nav-group" style={{ marginTop: "0.5rem" }}>
      <div className="nav-group__content">
        <Link className="nav__link" href="/admin/waiting-approvals">
          <span className="nav__link-label">{t("waitingApprovalsNavLink.label")}</span>
        </Link>
      </div>
    </div>
  );
}
