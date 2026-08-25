import React from "react";

/**
 * RFP follow-up: "sidebar ile topbar birleştiği yer garip duruyor... vibe
 * coding app gibi durmamalı". Root cause wasn't a CSS bug — `.nav`'s right
 * border and `.app-header`'s bottom border already share the same color and
 * meet cleanly. It was TWO brand marks on screen at once: SidebarLogo.tsx's
 * full "Vodafone | Pay" wordmark, and this component (Payload's built-in
 * StepNav home-icon override, present in every Payload install) rendering
 * ANOTHER, smaller, icon-only red square doing the same "go to /admin" job.
 *
 * RFP follow-up 25.08: rather than drop the horizontal Vodafone wordmark
 * entirely, it moved here to pair with the home glyph — the sidebar now
 * carries only the square Pay mark (SidebarLogo.tsx), so this is the
 * wordmark's one remaining home on screen. Payload renders this whole
 * component INSIDE its own single `<Link href="/admin">` (StepNav's
 * `__home` slot — see node_modules/@payloadcms/ui's StepNav/index.js), so
 * the logo and the icon are already one clickable target for free; nothing
 * here needs its own click handler. `currentColor` on the icon so it still
 * follows Payload's own light/dark theme instead of being hardcoded.
 */
export default function AdminIcon() {
  return (
    <span className="admin-topbar-home">
      <img src="/vodafone-logo.svg" alt="" className="admin-topbar-home__logo" />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="admin-topbar-home__icon">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1v-9" />
      </svg>
    </span>
  );
}
