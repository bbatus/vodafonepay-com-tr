"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { useDbStrings } from "./useDbStrings";

type LoginEntry = { createdAt: string; ip?: string; userAgent?: string };

/**
 * RFP feedback 3.5: "profilinde logine bağlı ip adresi, login time, user
 * agent... recent login history sini görsün." A `type: "ui"` field on Users
 * (self-service only — AuditLogs' read access now scopes non-maker users to
 * their own `userEmail` entries) rather than a duplicate data store; this
 * just queries the existing audit log.
 */
export default function LoginHistoryField() {
  const { user } = useAuth();
  const locale = useAdminLocale();
  const t = useDbStrings(locale);
  const [entries, setEntries] = useState<LoginEntry[] | null>(null);

  useEffect(() => {
    const email = (user as { email?: string } | undefined)?.email;
    if (!email) return;
    const params = new URLSearchParams({
      "where[action][equals]": "login",
      "where[userEmail][equals]": email,
      sort: "-createdAt",
      limit: "10",
      depth: "0",
    });
    fetch(`/api/audit-logs?${params.toString()}`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { docs: [] }))
      .then((data: { docs?: LoginEntry[] }) => setEntries(data.docs ?? []))
      .catch(() => setEntries([]));
  }, [user]);

  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  let body: React.ReactNode;
  if (entries === null) {
    body = <p className="login-history__hint">{t("loginHistory.loading")}</p>;
  } else if (entries.length === 0) {
    body = <p className="login-history__hint">{t("loginHistory.empty")}</p>;
  } else {
    body = (
      <table className="login-history__table">
        <thead>
          <tr>
            <th>{t("loginHistory.date")}</th>
            <th>{t("loginHistory.ip")}</th>
            <th>{t("loginHistory.userAgent")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={`${e.createdAt}-${e.ip ?? ""}`}>
              <td className="login-history__date">{new Date(e.createdAt).toLocaleString(dateLocale)}</td>
              <td>{e.ip ?? "—"}</td>
              <td className="login-history__ua" title={e.userAgent}>
                {e.userAgent ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="login-history">
      <p className="login-history__title">{t("loginHistory.title")}</p>
      {body}
    </div>
  );
}
