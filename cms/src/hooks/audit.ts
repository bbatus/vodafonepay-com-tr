import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, PayloadRequest } from "payload";

function actorOf(req: PayloadRequest): { email: string; role?: string } {
  const user = req.user as { email?: string; role?: string } | undefined;
  return { email: user?.email ?? "unknown", role: user?.role };
}

function ipOf(req: PayloadRequest): string | undefined {
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
function userAgentOf(req: PayloadRequest): string | undefined {
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
      },
    });
  } catch (err) {
    // Best-effort — a logging failure must never block the actual content
    // operation the user is trying to perform.
    console.error(`[audit] failed to write log entry for "${entry.action}" on "${entry.collectionSlug}":`, err);
  }
}

/**
 * RFP §3.1.15 / §7.2: attach to every content collection's `afterChange`
 * array. Distinguishes create/update/publish by operation + the resulting
 * `_status`, so a maker saving a draft and a checker publishing it show up
 * as two distinctly labeled entries even though both are Payload "update"
 * operations under the hood.
 */
export function auditAfterChange(collectionSlug: string): CollectionAfterChangeHook {
  return async ({ req, operation, doc, previousDoc }) => {
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
    await writeAuditLog(req, {
      action,
      collectionSlug,
      documentId: String(doc?.id ?? ""),
      summary: `${collectionSlug}: "${title}" ${actionVerb}`,
    });
    return doc;
  };
}

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
