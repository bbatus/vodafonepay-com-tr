import { Forbidden } from "payload";
import type { AfterErrorHook, CollectionAfterChangeHook, CollectionAfterDeleteHook, Endpoint, GlobalAfterChangeHook, PayloadRequest } from "payload";

function actorOf(req: PayloadRequest): { email: string; role?: string } {
  const user = req.user as { email?: string; role?: string } | undefined;
  return { email: user?.email ?? "unknown", role: user?.role };
}

/**
 * Exported so Users.ts's `afterLogin` hook can stamp `lastLoginIp` with the
 * exact same extraction logic this file already uses for every audit-log
 * entry — one definition of "how do we read the client IP", not two.
 */
export function ipOf(req: PayloadRequest): string | undefined {
  // PayloadRequest wraps a standard Request — Node/Next don't expose a
  // single canonical client-IP field, so this covers the headers a proxy
  // (or Next.js itself) is actually likely to set.
  return (
    req.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers?.get?.("x-real-ip") ||
    undefined
  );
}

/** RFP feedback 3.5: profile login history shows the browser/device (Mozilla/5.0 ...). */
export function userAgentOf(req: PayloadRequest): string | undefined {
  return req.headers?.get?.("user-agent") || undefined;
}

export async function writeAuditLog(req: PayloadRequest, entry: {
  action: string;
  collectionSlug?: string;
  documentId?: string;
  summary: string;
  /** Override for hooks (e.g. afterLogin) where req.user may not yet reflect the actor. */
  actorEmail?: string;
  actorRole?: string;
  /** RFP §7.2 "before/after image of changed data" — see diffFields() below. */
  changes?: FieldDiff[];
}) {
  const actor = entry.actorEmail ? { email: entry.actorEmail, role: entry.actorRole } : actorOf(req);
  try {
    await req.payload.create({
      collection: "audit-logs",
      overrideAccess: true,
      data: {
        userEmail: actor.email,
        userRole: actor.role,
        action: entry.action,
        collectionSlug: entry.collectionSlug,
        documentId: entry.documentId,
        summary: entry.summary,
        ip: ipOf(req),
        userAgent: userAgentOf(req),
        changes: entry.changes,
      },
    });
  } catch (err) {
    // Best-effort — a logging failure must never block the actual content
    // operation the user is trying to perform.
    console.error(`[audit] failed to write log entry for "${entry.action}" on "${entry.collectionSlug}":`, err);
  }
}

export type FieldDiff = { field: string; before: string; after: string };

/** Fields that change on every save regardless of real content edits, or that are never meaningful to show as a "before/after". */
const DIFF_IGNORE_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "_status",
  "sessions",
  "password",
  "salt",
  "hash",
  "loginAttempts",
  "lockUntil",
]);

/** Longest a single before/after value is allowed to be before truncation — a rich-text body diffed in full would bloat every save's audit row. */
const DIFF_VALUE_MAX_LENGTH = 300;

function stringifyForDiff(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "null";
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  return raw.length > DIFF_VALUE_MAX_LENGTH ? `${raw.slice(0, DIFF_VALUE_MAX_LENGTH)}…` : raw;
}

/**
 * RFP §7.2: "before/after image of the data that was changed" — the audit
 * log's own `summary` was always just a one-line "X güncellendi", with no
 * record of WHAT changed. Shallow, top-level-field diff only (not recursive
 * into arrays/blocks/richText internals) — deep-diffing a Lexical AST or a
 * Pages `layout` blocks array would produce noise no one could read, and the
 * point here is an audit trail a human can actually scan, not a full
 * document patch. Values are stringified and truncated (see
 * DIFF_VALUE_MAX_LENGTH) for the same reason.
 */
export function diffFields(before: Record<string, unknown> | null | undefined, after: Record<string, unknown> | null | undefined): FieldDiff[] {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diffs: FieldDiff[] = [];
  for (const key of keys) {
    if (DIFF_IGNORE_FIELDS.has(key)) continue;
    const beforeValue = before[key];
    const afterValue = after[key];
    if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) continue;
    diffs.push({ field: key, before: stringifyForDiff(beforeValue), after: stringifyForDiff(afterValue) });
  }
  return diffs;
}

/**
 * RFP §3.1.15 / §7.2: attach to every content collection's `afterChange`
 * array. Distinguishes create/update/publish by operation + the resulting
 * `_status`, so a maker saving a draft and a checker publishing it show up
 * as two distinctly labeled entries even though both are Payload "update"
 * operations under the hood.
 */
export function auditAfterChange(collectionSlug: string): CollectionAfterChangeHook {
  return async ({ req, operation, doc, previousDoc, context }) => {
    // Users.ts's afterLogin hook stamps lastLoginAt/lastLoginIp/lastLoginUserAgent
    // via a plain payload.update() on every single login — without this
    // escape hatch that would double up on the "login" audit entry the same
    // hook already writes, with a near-duplicate "users: X güncellendi" on
    // every login. `writeAuditLog` itself still runs for every OTHER update.
    if (context?.skipAudit) return doc;
    const wasPublished = previousDoc?._status === "published";
    const isPublished = doc?._status === "published";
    let action: "create" | "publish" | "update";
    if (operation === "create") {
      action = "create";
    } else if (!wasPublished && isPublished) {
      action = "publish";
    } else {
      action = "update";
    }
    const title = doc?.title ?? doc?.label ?? doc?.name ?? doc?.businessName ?? doc?.email ?? String(doc?.id ?? "");
    const actionVerb = { create: "oluşturuldu", publish: "yayınlandı", update: "güncellendi" }[action];
    // Only a real update has a previousDoc to diff against — a fresh create
    // has nothing to compare, and diffing it against `{}` would just list
    // every field as "changed", which isn't a meaningful before/after.
    const changes = operation === "update" ? diffFields(previousDoc, doc) : undefined;
    await writeAuditLog(req, {
      action,
      collectionSlug,
      documentId: String(doc?.id ?? ""),
      summary: `${collectionSlug}: "${title}" ${actionVerb}`,
      changes,
    });
    return doc;
  };
}

/**
 * RFP §7.2: "record all updates/changes to userID access rights" — a role
 * change used to disappear into `auditAfterChange("users")`'s generic
 * "users: X güncellendi" entry, indistinguishable from an avatar upload or a
 * locale-preference tweak. Wire this into Users.ts's `afterChange` array
 * ALONGSIDE (not instead of) `auditAfterChange("users")` — that one still
 * owns create/update/publish in general; this only fires the extra, more
 * specific entry when `role` itself actually changed.
 */
export const auditRoleChange: CollectionAfterChangeHook = async ({ req, operation, doc, previousDoc }) => {
  if (operation !== "update") return doc;
  const before = previousDoc?.role;
  const after = doc?.role;
  if (!after || before === after) return doc;
  const target = doc?.email ?? String(doc?.id ?? "");
  await writeAuditLog(req, {
    action: "role_changed",
    collectionSlug: "users",
    documentId: String(doc?.id ?? ""),
    summary: `${target} kullanıcısının rolü "${before ?? "—"}" → "${after}" olarak değiştirildi`,
  });
  return doc;
};

/** Globals (e.g. ContactInfo) have no id/create/delete concept — every write is an "update". */
export function auditGlobalAfterChange(globalSlug: string): GlobalAfterChangeHook {
  return async ({ req, doc }) => {
    await writeAuditLog(req, {
      action: "update",
      collectionSlug: globalSlug,
      summary: `${globalSlug} güncellendi`,
    });
    return doc;
  };
}

export function auditAfterDelete(collectionSlug: string): CollectionAfterDeleteHook {
  return async ({ req, doc, id }) => {
    const title = doc?.title ?? doc?.label ?? doc?.name ?? doc?.businessName ?? doc?.email ?? String(id);
    await writeAuditLog(req, {
      action: "delete",
      collectionSlug,
      documentId: String(id),
      summary: `${collectionSlug}: "${title}" silindi`,
    });
  };
}

/**
 * RFP §7.2: "record every print-out/export of certain predefined
 * reports/data entities" — a plain `GET /api/{collection}` (what every CSV
 * export button already does to fetch its rows) is a read, so no
 * `afterChange`/`afterDelete` hook ever sees it. This is a small, dedicated
 * endpoint the client fires *after* a successful export completes, purely to
 * record that it happened — see CsvExportButton.tsx.
 *
 * Deliberately doesn't try to re-fetch or re-derive the exported rows itself
 * (that would duplicate the REST GET the button already made) — it trusts
 * the caller's own collection/count, the same "best effort, must never block
 * the actual user action" posture every other audit write in this file has.
 */
export const auditExportEndpoint: Endpoint = {
  path: "/audit/export",
  method: "post",
  handler: async (req) => {
    if (!req.user?.id) {
      return Response.json({ errors: [{ message: "Giriş yapmalısınız." }] }, { status: 401 });
    }
    let body: { collection?: string; count?: number } = {};
    try {
      if (req.json) body = await req.json();
    } catch {
      // Malformed body shouldn't block the (already-completed) export.
    }
    const collectionSlug = typeof body.collection === "string" && body.collection ? body.collection : "unknown";
    const count = typeof body.count === "number" ? body.count : undefined;
    await writeAuditLog(req, {
      action: "export",
      collectionSlug,
      summary: `${collectionSlug}: ${count ?? "?"} kayıt CSV olarak dışa aktarıldı`,
    });
    return Response.json({ ok: true });
  },
};

const VERB_BY_METHOD: Record<string, string> = {
  DELETE: "silme",
  PATCH: "değiştirme",
  PUT: "değiştirme",
  POST: "oluşturma/ekleme",
};

/**
 * RFP §7.2: "record all attempts to delete, write or append certain
 * predefined data entities" — until now only the SUCCESSFUL half of a write
 * was ever logged (afterChange/afterDelete only fire once an operation has
 * already gone through). A rejected write never left a trace anywhere.
 *
 * Wired into `payload.config.ts`'s root-level `hooks.afterError` — that's
 * the one extension point that fires for EVERY collection's errors in one
 * place (confirmed in @payloadcms/next's routeError.js: it calls the
 * collection's own `afterError` array, THEN the root config's, regardless
 * of which collection the request targeted), so this doesn't need wiring
 * into each collection's hooks individually the way audit.ts's other
 * factories do.
 *
 * Scoped to `Forbidden` (403) specifically — a 400 validation error or a
 * 404 isn't "someone attempting something they're not allowed to do", it's
 * just an honest mistake, and logging every typo would drown the signal
 * this is actually for. Anonymous 403s are skipped too: without a known
 * `req.user`, "who attempted this" has nothing to name.
 */
export const auditForbiddenAttempt: AfterErrorHook = async ({ error, req, collection }) => {
  if (!(error instanceof Forbidden)) return;
  if (!req.user) return;
  const collectionSlug = collection?.slug;
  const verb = VERB_BY_METHOD[req.method ?? ""] ?? "işlem";
  await writeAuditLog(req, {
    action: "denied",
    collectionSlug,
    summary: `${collectionSlug ?? "sistem"} üzerinde yetkisiz ${verb} denemesi engellendi`,
  });
};
