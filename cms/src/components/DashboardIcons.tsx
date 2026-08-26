import type { SVGProps } from "react";

/**
 * Small hand-rolled stroke icons (matching UserAvatarIcon.tsx's existing
 * pattern in this codebase) instead of pulling in an icon library as a new
 * dependency — that would need its own Trivy/Sonar pass for one dashboard.
 * 20x20, currentColor, 1.75 stroke — sized to sit next to a label without
 * fighting Payload's own UI icons.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconContent(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </Icon>
  );
}

export function IconPage(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 14h3" />
    </Icon>
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.2a3.25 3.25 0 0 1 0 6.3M21.5 20c0-3-1.9-5.2-4.8-5.85" />
    </Icon>
  );
}

export function IconFaq(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.6 9.2a2.4 2.4 0 1 1 3.6 2.08c-.86.5-1.2.98-1.2 1.72" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export function IconCampaign(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l4.5 3.2a.6.6 0 0 0 .95-.48V6.28a.6.6 0 0 0-.95-.48L6 9H4a1 1 0 0 0-1 1Z" />
      <path d="M17 8.5a4.5 4.5 0 0 1 0 7M19.8 5.7a8.5 8.5 0 0 1 0 12.6" />
    </Icon>
  );
}

export function IconBlog(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 19.5V17l10.5-10.5a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12L7 20H4.5a.5.5 0 0 1-.5-.5Z" />
      <path d="M13 6l3 3" />
    </Icon>
  );
}

export function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 7v5l3.5 2" />
    </Icon>
  );
}

export function IconCheckCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M8 12.3l2.6 2.6L16.2 9" />
    </Icon>
  );
}

/**
 * Same pencil as IconBlog, on purpose — "a draft" and "a blog post" are both
 * "something being written". Kept as an alias rather than a second copy of the
 * same paths so the two can never drift apart silently; give it its own glyph
 * here if the two ever need to look different.
 */
export const IconDraft = IconBlog;

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon width="14" height="14" {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}
