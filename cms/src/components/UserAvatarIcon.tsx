"use client";

import { useAuth } from "@payloadcms/ui";

/**
 * RFP feedback 4a: the top-right header icon never actually showed the
 * logged-in user's uploaded profile photo — Payload's default `Account`
 * graphic only supports "default" (generic silhouette) or "gravatar",
 * neither of which reads our own `users.avatar` upload field. `admin.avatar`
 * accepts a custom component for exactly this case (see
 * node_modules/payload/dist/config/types.d.ts). Same 25x25 sizing as
 * Payload's DefaultAccountIcon so it drops in without layout shift.
 */
type PopulatedAvatar = { url?: string } | string | null | undefined;

export default function UserAvatarIcon() {
  const { user } = useAuth();
  const avatar = (user as { avatar?: PopulatedAvatar } | undefined)?.avatar;
  const url = avatar && typeof avatar === "object" ? avatar.url : undefined;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small 25x25 header icon, not a content image
      <img
        src={url}
        alt=""
        width={25}
        height={25}
        style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
      />
    );
  }

  return (
    <svg height="25" viewBox="0 0 25 25" width="25" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.5" cy="12.5" r="11.5" fill="var(--theme-elevation-150)" />
      <circle cx="12.5" cy="10.73" r="3.98" fill="var(--theme-elevation-400)" />
      <path
        d="M12.5,24a11.44,11.44,0,0,0,7.66-2.94c-.5-2.71-3.73-4.8-7.66-4.8s-7.16,2.09-7.66,4.8A11.44,11.44,0,0,0,12.5,24Z"
        fill="var(--theme-elevation-400)"
      />
    </svg>
  );
}
