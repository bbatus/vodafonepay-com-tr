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
 *
 * Also shows WHO is logged in, next to the photo — added ahead of the LDAP
 * cutover (see Users.ts `username` field): once vodafone.local login lands,
 * accounts sign in with a username, not an email, and this is the one place
 * in the header that currently tells you which account you're in. Prefers
 * `username`, falls back to `email` for every account that predates it (i.e.
 * all of them, today).
 */
type PopulatedAvatar = { url?: string } | string | null | undefined;

export default function UserAvatarIcon() {
  const { user } = useAuth();
  const typedUser = user as { avatar?: PopulatedAvatar; username?: string; email?: string } | undefined;
  const avatar = typedUser?.avatar;
  const url = avatar && typeof avatar === "object" ? avatar.url : undefined;
  const identity = typedUser?.username || typedUser?.email;

  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {identity && (
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--theme-elevation-600)",
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {identity}
        </span>
      )}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- small 25x25 header icon, not a content image
        <img
          src={url}
          alt=""
          width={25}
          height={25}
          style={{ borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }}
        />
      ) : (
        <svg height="25" viewBox="0 0 25 25" width="25" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <circle cx="12.5" cy="12.5" r="11.5" fill="var(--theme-elevation-150)" />
          <circle cx="12.5" cy="10.73" r="3.98" fill="var(--theme-elevation-400)" />
          <path
            d="M12.5,24a11.44,11.44,0,0,0,7.66-2.94c-.5-2.71-3.73-4.8-7.66-4.8s-7.16,2.09-7.66,4.8A11.44,11.44,0,0,0,12.5,24Z"
            fill="var(--theme-elevation-400)"
          />
        </svg>
      )}
    </span>
  );
}
