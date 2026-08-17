"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";
import { ROLES } from "@/access/roles";

/**
 * RFP feedback 5.6: the Users list gets a `lockUntil` column, but a column
 * only helps if you already scrolled to the right row. This banner surfaces
 * "N accounts are locked right now" at the top of the list and links to the
 * screen that can clear them. Rendered only for the role that can act on it.
 */
export default function LockedAccountsBanner() {
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const { user } = useAuth();
  const isNvMaker = (user as { role?: string } | undefined)?.role === ROLES.NEW_VERTICAL_MAKER;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isNvMaker) return;
    const params = new URLSearchParams({
      limit: "0",
      depth: "0",
      "where[lockUntil][greater_than]": new Date().toISOString(),
    });
    fetch(`/api/users?${params.toString()}`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { totalDocs?: number } | null) => setCount(data?.totalDocs ?? 0))
      .catch(() => setCount(0));
  }, [isNvMaker]);

  if (!isNvMaker || count === 0) return null;

  return (
    <div className="locked-accounts-banner">
      <span>{t("lockedAccounts.bannerCount").replace("{n}", String(count))}</span>
      <Link href="/admin/locked-accounts">{t("lockedAccounts.bannerCta")}</Link>
    </div>
  );
}
