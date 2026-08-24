import React from "react";

/**
 * RFP follow-up: "sidebar ile topbar birleştiği yer garip duruyor... vibe
 * coding app gibi durmamalı". Root cause wasn't a CSS bug — `.nav`'s right
 * border and `.app-header`'s bottom border already share the same color and
 * meet cleanly. It was TWO brand marks on screen at once: SidebarLogo.tsx's
 * full "Vodafone | Pay" wordmark, and this component (Payload's built-in
 * StepNav home-icon override, present in every Payload install) rendering
 * ANOTHER, smaller, icon-only red square doing the same "go to /admin" job.
 * A quiet monochrome glyph reads as what it actually is — a breadcrumb
 * utility icon, not a second logo — leaving the sidebar wordmark as the
 * page's one brand identity. `currentColor` so it follows Payload's own
 * light/dark theme instead of being hardcoded.
 */
export default function AdminIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
