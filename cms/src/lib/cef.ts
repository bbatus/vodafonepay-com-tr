/**
 * RFP §6 (Security/Audits): "export audit logs in CEF format for SIEM
 * ingestion (e.g. ArcSight)". There's no real ArcSight/SIEM endpoint this
 * environment can send to — that's a genuine infrastructure/vendor
 * relationship, not something a code change can stand up — so this produces
 * a downloadable, spec-correct CEF file an admin can hand to whatever
 * collector actually exists, the same "download, don't push" shape the
 * existing CSV export already uses.
 *
 * Format (ArcSight Common Event Format, one line per event):
 *   CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension
 */

const CEF_VERSION = 0;
const DEVICE_VENDOR = "VodafonePay";
const DEVICE_PRODUCT = "CMS";
const DEVICE_VERSION = "1.0";

/** CEF header fields: pipe and backslash are the two characters that break the format if unescaped. */
function escapeHeader(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|");
}

/** CEF extension values: backslash, equals, and newlines are the ones that break `key=value key2=value2` parsing. */
function escapeExtension(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("=", "\\=").replaceAll("\n", "\\n");
}

const ACTION_NAMES: Record<string, string> = {
  login: "User Login",
  login_failed: "Failed Login Attempt",
  logout: "User Logout",
  locked: "Login Attempt on Locked Account",
  unlock: "Account Unlocked",
  create: "Record Created",
  update: "Record Updated",
  publish: "Record Published",
  rejected: "Record Rejected",
  delete: "Record Deleted",
  role_changed: "User Role Changed",
  export: "Data Exported",
  denied: "Unauthorized Attempt Blocked",
};

/**
 * CEF severity is 0 (lowest) to 10 (highest) — not a free-text field, so this
 * maps our action taxonomy onto it. Denied/failed/locked events (signals of
 * a possible attack or misuse) sit higher than routine content edits.
 */
const ACTION_SEVERITY: Record<string, number> = {
  denied: 8,
  login_failed: 6,
  locked: 7,
  delete: 5,
  role_changed: 6,
  unlock: 4,
  publish: 3,
  rejected: 3,
  create: 2,
  update: 2,
  export: 3,
  login: 1,
  logout: 1,
};

export type CefEvent = {
  createdAt?: string;
  userEmail?: string;
  userRole?: string;
  action?: string;
  collectionSlug?: string;
  documentId?: string;
  summary?: string;
  ip?: string;
  userAgent?: string;
};

export function eventToCef(e: CefEvent): string {
  const action = e.action ?? "unknown";
  const name = ACTION_NAMES[action] ?? action;
  const severity = ACTION_SEVERITY[action] ?? 1;
  const rt = e.createdAt ? new Date(e.createdAt).getTime() : Date.now();

  const extensionParts: string[] = [`rt=${rt}`];
  if (e.userEmail) extensionParts.push(`suser=${escapeExtension(e.userEmail)}`);
  if (e.ip) extensionParts.push(`src=${escapeExtension(e.ip)}`);
  if (e.userAgent) extensionParts.push(`requestClientApplication=${escapeExtension(e.userAgent)}`);
  extensionParts.push(`act=${escapeExtension(action)}`);
  if (e.userRole) extensionParts.push(`cs1Label=Role cs1=${escapeExtension(e.userRole)}`);
  if (e.collectionSlug) extensionParts.push(`cs2Label=Collection cs2=${escapeExtension(e.collectionSlug)}`);
  if (e.documentId) extensionParts.push(`cs3Label=DocumentId cs3=${escapeExtension(e.documentId)}`);
  if (e.summary) extensionParts.push(`msg=${escapeExtension(e.summary)}`);

  const header = [
    "CEF:" + CEF_VERSION,
    escapeHeader(DEVICE_VENDOR),
    escapeHeader(DEVICE_PRODUCT),
    escapeHeader(DEVICE_VERSION),
    escapeHeader(action),
    escapeHeader(name),
    String(severity),
  ].join("|");

  return `${header}|${extensionParts.join(" ")}`;
}

export function buildCef(events: CefEvent[]): string {
  return events.map(eventToCef).join("\n");
}

export function downloadCef(cef: string, filename: string): void {
  const blob = new Blob([cef], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
