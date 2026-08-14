import React from "react";

/**
 * RFP feedback 3.9: the admin sidebar had no branding at all — just the
 * plain collection-group text links. Wired via admin.components.beforeNav,
 * so it renders once at the top of the nav, above every group.
 */
export default function SidebarLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "1rem 0 0.5rem" }}>
      <img src="/admin-logo.svg" alt="Vodafone Pay" style={{ height: 28, width: "auto" }} />
    </div>
  );
}
