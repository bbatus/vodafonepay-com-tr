"use client";

import { useState } from "react";
import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { HELP_CONTENT } from "@/lib/helpContent";
import { getRolePermissionSummary } from "@/lib/rolePermissions";

/**
 * A per-collection "?" help button. Editors land on a collection's list
 * (or, for globals, the single edit page) with no in-app explanation of
 * what the section is for or how to do the routine things in it — this
 * closes that gap without needing a separate help site. Content lives in
 * `helpContent.ts`, keyed by collection/global slug; this component just
 * renders whatever entry matches `collection` and says nothing if there
 * isn't one, so a collection without documented help doesn't error.
 */
export default function HelpButton({ collection }: { collection: string }) {
  const [open, setOpen] = useState(false);
  const locale = useAdminLocale();
  const { user } = useAuth();
  const entry = HELP_CONTENT[collection];
  const permissions = getRolePermissionSummary(collection, (user as { role?: string } | undefined)?.role, locale);

  if (!entry && !permissions) return null;
  const content = entry?.[locale];

  return (
    <div style={{ margin: "0.5rem 0" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid #d1d5db",
          background: open ? "#111827" : "white",
          color: open ? "white" : "#374151",
          fontWeight: 700,
          cursor: "pointer",
          lineHeight: 1,
        }}
        title={locale === "tr" ? "Yardım" : "Help"}
      >
        ?
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            padding: "1rem 1.25rem",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fafafa",
            maxWidth: 640,
          }}
        >
          {content && (
            <>
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{content.title}</p>
              <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
                {content.steps.map((step, i) => (
                  <li key={i} style={{ fontSize: "0.875rem", color: "#374151" }}>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          )}
          {permissions && (
            <div style={{ marginTop: content ? "1rem" : 0, paddingTop: content ? "0.75rem" : 0, borderTop: content ? "1px solid #e5e7eb" : "none" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                {locale === "tr" ? `Sizin yetkiniz (${permissions.roleLabel})` : `Your permissions (${permissions.roleLabel})`}
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
                {permissions.lines.map((line, i) => (
                  <li key={i} style={{ fontSize: "0.875rem", color: "#374151" }}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
