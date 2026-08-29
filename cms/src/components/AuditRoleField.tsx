"use client";

import { useField } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { ROLE_OPTIONS } from "@/access/roles";

/**
 * Read-only display for AuditLogs.userRole. The column stores the raw role
 * slug and keeps storing it — an audit trail should record the exact machine
 * value — but a reviewer reading the log should not have to decode
 * `growth_maker`. A role that has since been retired falls through to its raw
 * value rather than rendering blank.
 */
export default function AuditRoleField({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  const locale = useAdminLocale();
  const label = ROLE_OPTIONS.find((o) => o.value === value)?.label[locale];
  return (
    <div className="field-type text">
      <span className="field-label">{locale === "tr" ? "Rol" : "Role"}</span>
      <div className="account-form__readonly-value">{label ?? value ?? "—"}</div>
    </div>
  );
}
