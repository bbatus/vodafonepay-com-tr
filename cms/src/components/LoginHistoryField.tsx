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
    body = <p style={{ fontSize: "0.8rem", color: "var(--theme-elevation-450)" }}>{t("loginHistory.loading")}</p>;
  } else if (entries.length === 0) {
    body = <p style={{ fontSize: "0.8rem", color: "var(--theme-elevation-450)" }}>{t("loginHistory.empty")}</p>;
  } else {
    body = (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--theme-elevation-450)", fontWeight: 500 }}>
              {t("loginHistory.date")}
            </th>
            <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--theme-elevation-450)", fontWeight: 500 }}>
              {t("loginHistory.ip")}
            </th>
            <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--theme-elevation-450)", fontWeight: 500 }}>
              {t("loginHistory.userAgent")}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={`${e.createdAt}-${e.ip ?? ""}`} style={{ borderTop: "1px solid var(--theme-elevation-100)" }}>
              <td style={{ padding: "0.35rem 0.5rem", whiteSpace: "nowrap" }}>{new Date(e.createdAt).toLocaleString(dateLocale)}</td>
              <td style={{ padding: "0.35rem 0.5rem" }}>{e.ip ?? "—"}</td>
              <td style={{ padding: "0.35rem 0.5rem", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.userAgent}>
                {e.userAgent ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div style={{ margin: "0.5rem 0 1rem" }}>
      <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{t("loginHistory.title")}</p>
      {body}
    </div>
  );
}
