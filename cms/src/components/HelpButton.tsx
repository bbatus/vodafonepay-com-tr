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
    <div className="help-button">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`help-button__toggle${open ? " help-button__toggle--open" : ""}`}
        title={locale === "tr" ? "Yardım" : "Help"}
      >
        ?
      </button>
      {open && (
        <div className="help-button__panel">
          {content && (
            <>
              <p className="help-button__panel-title">{content.title}</p>
              <ol className="help-button__list">
                {content.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}
          {permissions && (
            <div className={`help-button__permissions${content ? " help-button__permissions--after-content" : ""}`}>
              <p className="help-button__panel-title">
                {locale === "tr" ? `Sizin yetkiniz (${permissions.roleLabel})` : `Your permissions (${permissions.roleLabel})`}
              </p>
              <ul className="help-button__list">
                {permissions.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
