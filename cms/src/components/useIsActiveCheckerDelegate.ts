"use client";

import { useEffect, useState } from "react";
import { ROLES } from "@/access/roles";

/**
 * Answers the same question `hasActiveCheckerDelegate` answers server-side
 * (access/roles.ts): is this Growth Maker currently standing in for an absent
 * checker (RFP §3.1 delegation)? A delegate is allowed to publish server-side,
 * so any UI that hides publishing from a Maker has to make the same exception
 * or the delegate would have no way to act on the right they actually have.
 *
 * Client components only know the session's own role via `useAuth()`, so this
 * asks over plain REST — `users.read` is already open to every authenticated
 * role (`read: authenticated` in Users.ts), no dedicated endpoint needed.
 *
 * Extracted from RoleAwarePublishButton (28.08) once MakerAwarePublishButton
 * needed the identical check; both import it from here rather than keeping two
 * copies of the query in sync by hand.
 */
export function useIsActiveCheckerDelegate(role: string | undefined, userId: string | number | undefined): boolean {
  const [isActiveDelegate, setIsActiveDelegate] = useState(false);

  useEffect(() => {
    if (role !== ROLES.GROWTH_MAKER || !userId) return;
    const params = new URLSearchParams({
      limit: "1",
      depth: "0",
      "where[and][0][delegateTo][equals]": String(userId),
      "where[and][1][role][in][0]": ROLES.NEW_VERTICAL_CHECKER,
      "where[and][1][role][in][1]": ROLES.GROWTH_CHECKER,
      "where[and][2][or][0][delegationExpiresAt][exists]": "false",
      "where[and][2][or][1][delegationExpiresAt][greater_than]": new Date().toISOString(),
    });
    let cancelled = false;
    fetch(`/api/users?${params.toString()}`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setIsActiveDelegate((data?.totalDocs ?? 0) > 0);
      })
      .catch(() => {
        if (!cancelled) setIsActiveDelegate(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, userId]);

  return isActiveDelegate;
}
