"use client";

import { useState } from "react";
import { useAdminLocale } from "./useAdminLocale";
import { HELP_CONTENT } from "@/lib/helpContent";

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
  const entry = HELP_CONTENT[collection];

  if (!entry) return null;
  const content = entry[locale];

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
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{content.title}</p>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
            {content.steps.map((step, i) => (
              <li key={i} style={{ fontSize: "0.875rem", color: "#374151" }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
