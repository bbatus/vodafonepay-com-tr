import React from "react";
import Link from "next/link";

/**
 * RFP feedback 3.9: the admin sidebar had no branding at all — just the
 * plain collection-group text links. Wired via admin.components.beforeNav,
 * so it renders once at the top of the nav, above every group.
 *
 * Was a plain <img>, not a link — every other admin dashboard's sidebar
 * logo doubles as a "take me home" shortcut, and this one silently didn't.
 * Points at /admin, same destination as the topbar logo (AdminLogo.tsx).
 */
export default function SidebarLogo() {
  return (
    <Link href="/admin" className="sidebar-logo" aria-label="Vodafone Pay — Anasayfa" title="Anasayfa">
      <img src="/admin-logo.svg" alt="Vodafone Pay" className="sidebar-logo__img" />
    </Link>
  );
}
