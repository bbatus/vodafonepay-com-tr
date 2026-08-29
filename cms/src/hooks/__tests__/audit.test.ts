import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { Forbidden } from "payload";
import {
  auditAfterChange,
  auditAfterDelete,
  auditExportEndpoint,
  auditForbiddenAttempt,
  auditGlobalAfterChange,
  auditRoleChange,
  diffFields,
  writeAuditLog,
} from "@/hooks/audit";

function fakeReq(overrides: { user?: { email?: string; role?: string }; headers?: Record<string, string> } = {}) {
  const create = vi.fn().mockResolvedValue({});
  const headerMap = new Map(Object.entries(overrides.headers ?? {}));
  return {
    req: {
      user: overrides.user,
      payload: { create },
      headers: { get: (key: string) => headerMap.get(key) ?? null },
    } as unknown as PayloadRequest,
    create,
  };
}

describe("writeAuditLog", () => {
  it("writes an entry with the actor's email/role and never throws to the caller", async () => {
    const { req, create } = fakeReq({ user: { email: "maker@vodafonepay.local", role: "ROLE_VODAFONEPAY_CMS_MAKER_RW" } });
    await writeAuditLog(req, { action: "create", collectionSlug: "campaigns", documentId: "5", summary: "test" });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "audit-logs",
        overrideAccess: true,
        data: expect.objectContaining({
          userEmail: "maker@vodafonepay.local",
          userRole: "ROLE_VODAFONEPAY_CMS_MAKER_RW",
          action: "create",
          collectionSlug: "campaigns",
          documentId: "5",
        }),
      })
    );
  });

  it("falls back to 'unknown' when there is no authenticated user", async () => {
    const { req, create } = fakeReq();
    await writeAuditLog(req, { action: "login_failed", summary: "test" });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userEmail: "unknown" }) }));
  });

  it("reads the client IP from x-forwarded-for", async () => {
    const { req, create } = fakeReq({ headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" } });
    await writeAuditLog(req, { action: "login", summary: "test" });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ip: "203.0.113.5" }) }));
  });

  it("is best-effort: a logging failure does not throw", async () => {
    const { req, create } = fakeReq();
    create.mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(writeAuditLog(req, { action: "create", summary: "test" })).resolves.toBeUndefined();
  });
});

describe("auditAfterChange", () => {
  it("logs 'create' on a create operation", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    const hook = auditAfterChange("campaigns");
    await hook({ req, operation: "create", doc: { id: 1, title: "Test" }, previousDoc: undefined } as never);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "create" }) }));
  });

  it("logs 'publish' when status flips from draft to published", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    const hook = auditAfterChange("campaigns");
    await hook({
      req,
      operation: "update",
      doc: { id: 1, title: "Test", _status: "published" },
      previousDoc: { id: 1, title: "Test", _status: "draft" },
    } as never);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "publish" }) }));
  });

  it("logs 'update' for a plain edit that doesn't change publish status", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    const hook = auditAfterChange("campaigns");
    await hook({
      req,
      operation: "update",
      doc: { id: 1, title: "Test", _status: "published" },
      previousDoc: { id: 1, title: "Test", _status: "published" },
    } as never);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "update" }) }));
  });
});

describe("auditAfterDelete", () => {
  it("logs a 'delete' entry with the deleted document's title", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    const hook = auditAfterDelete("campaigns");
    await hook({ req, id: 7, doc: { title: "Silinen" } } as never);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "delete", documentId: "7" }) })
    );
  });
});

describe("auditGlobalAfterChange", () => {
  it("logs an 'update' entry for the global", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    const hook = auditGlobalAfterChange("contact-info");
    await hook({ req, doc: {} } as never);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "update", collectionSlug: "contact-info" }) })
    );
  });
});

describe("auditExportEndpoint", () => {
  it("401s an unauthenticated request without writing a log entry", async () => {
    const { req, create } = fakeReq();
    const reqWithJson = { ...req, json: vi.fn() } as unknown as PayloadRequest;
    const res = await auditExportEndpoint.handler!(reqWithJson);
    expect(res.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("logs an 'export' entry naming the collection and record count from the request body", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    const reqWithJson = { ...req, user: { id: "1", email: "a@b.com" }, json: vi.fn().mockResolvedValue({ collection: "campaigns", count: 42 }) } as unknown as PayloadRequest;
    const res = await auditExportEndpoint.handler!(reqWithJson);
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "export", collectionSlug: "campaigns", summary: expect.stringContaining("42") }),
      })
    );
  });

  it("degrades to 'unknown' collection and '?' count on a malformed/empty body, without failing the request", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    const reqWithJson = { ...req, user: { id: "1", email: "a@b.com" }, json: vi.fn().mockRejectedValue(new Error("bad json")) } as unknown as PayloadRequest;
    const res = await auditExportEndpoint.handler!(reqWithJson);
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ collectionSlug: "unknown", summary: expect.stringContaining("?") }),
      })
    );
  });
});

describe("auditForbiddenAttempt", () => {
  it("logs a 'denied' entry for a Forbidden error from an authenticated user", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    await auditForbiddenAttempt({
      error: new Forbidden(),
      req,
      collection: { slug: "campaigns" },
    } as never);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "denied", collectionSlug: "campaigns" }) })
    );
  });

  it("ignores an anonymous Forbidden — no user to name means nothing worth logging", async () => {
    const { req, create } = fakeReq();
    await auditForbiddenAttempt({ error: new Forbidden(), req, collection: { slug: "campaigns" } } as never);
    expect(create).not.toHaveBeenCalled();
  });

  it("ignores any error that isn't a Forbidden — a 400/404 is an honest mistake, not an access attempt", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    await auditForbiddenAttempt({ error: new Error("some other error"), req, collection: { slug: "campaigns" } } as never);
    expect(create).not.toHaveBeenCalled();
  });

  it("picks the right Turkish verb per HTTP method", async () => {
    const { req, create } = fakeReq({ user: { email: "a@b.com" } });
    await auditForbiddenAttempt({
      error: new Forbidden(),
      req: { ...req, method: "DELETE" },
      collection: { slug: "campaigns" },
    } as never);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ summary: expect.stringContaining("silme") }) }));
  });
});

/**
 * `diffFields` is what puts the "Değişiklikler" before/after panel on an audit
 * record — RFP §7.2's "before/after image of the data that was changed". It
 * was the largest untested piece of this file at the 29.08 coverage run, and
 * it is exactly the kind of code where a silent regression is invisible: a
 * broken diff still renders a perfectly plausible-looking empty panel.
 */
describe("diffFields", () => {
  it("reports only the fields that actually changed", () => {
    const diffs = diffFields({ title: "Eski", order: 3, body: "aynı" }, { title: "Yeni", order: 3, body: "aynı" });
    expect(diffs).toEqual([{ field: "title", before: "Eski", after: "Yeni" }]);
  });

  it("records a field that appears or disappears, not just one that is edited", () => {
    expect(diffFields({ deeplink: undefined }, { deeplink: "/kampanyalar" })).toEqual([
      { field: "deeplink", before: "—", after: "/kampanyalar" },
    ]);
    expect(diffFields({ deeplink: "/kampanyalar" }, { deeplink: null })).toEqual([
      { field: "deeplink", before: "/kampanyalar", after: "null" },
    ]);
  });

  it("skips the bookkeeping fields every save touches", () => {
    const diffs = diffFields(
      { updatedAt: "2026-08-28T00:00:00.000Z", title: "A" },
      { updatedAt: "2026-08-29T00:00:00.000Z", title: "A" }
    );
    expect(diffs).toEqual([]);
  });

  it("compares structurally, so a reordered object is not a change but a real edit is", () => {
    expect(diffFields({ meta: { a: 1, b: 2 } }, { meta: { a: 1, b: 2 } })).toEqual([]);
    expect(diffFields({ meta: { a: 1 } }, { meta: { a: 2 } })).toHaveLength(1);
  });

  /** A rich-text body diffed in full would bloat every single save's audit row. */
  it("truncates a very long value instead of storing all of it", () => {
    const long = "x".repeat(500);
    const [diff] = diffFields({ body: "kısa" }, { body: long });
    expect(diff.after.endsWith("…")).toBe(true);
    expect(diff.after.length).toBeLessThan(long.length);
  });

  it("treats a missing before or after as nothing to diff", () => {
    expect(diffFields(null, { title: "A" })).toEqual([]);
    expect(diffFields({ title: "A" }, undefined)).toEqual([]);
    expect(diffFields(undefined, undefined)).toEqual([]);
  });
});

/**
 * A role change is the one Users edit with real security weight, and without
 * this hook it lands in the log as a generic "users: X güncellendi" — the same
 * line an avatar upload produces. (Roles are LDAP/AccessPoint-managed and the
 * field is read-only in the panel, so this fires for out-of-band changes,
 * which is precisely when an auditor needs to find it.)
 */
describe("auditRoleChange", () => {
  const run = (args: { operation: string; doc: unknown; previousDoc?: unknown }) => {
    const { req, create } = fakeReq({ user: { email: "admin@vodafonepay.local" } });
    return auditRoleChange({ req, ...args } as never).then(() => create);
  };

  it("writes a dedicated entry naming both the old and the new role", async () => {
    const create = await run({
      operation: "update",
      previousDoc: { role: "growth_maker" },
      doc: { id: 12, email: "ece.boran@vodafone.com", role: "growth_checker" },
    });
    expect(create).toHaveBeenCalledTimes(1);
    const entry = create.mock.calls[0][0].data;
    expect(entry.action).toBe("role_changed");
    expect(entry.collectionSlug).toBe("users");
    expect(entry.documentId).toBe("12");
    expect(entry.summary).toContain("ece.boran@vodafone.com");
    expect(entry.summary).toContain("growth_maker");
    expect(entry.summary).toContain("growth_checker");
  });

  it("stays quiet when the role did not change", async () => {
    const create = await run({
      operation: "update",
      previousDoc: { role: "growth_maker" },
      doc: { id: 12, email: "e@v.com", role: "growth_maker" },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("stays quiet on create — that is the general hook's job, not this one", async () => {
    const create = await run({ operation: "create", doc: { id: 1, role: "growth_maker" } });
    expect(create).not.toHaveBeenCalled();
  });

  it("falls back to the id when the account has no email yet", async () => {
    const create = await run({
      operation: "update",
      previousDoc: { role: undefined },
      doc: { id: 99, role: "growth_maker" },
    });
    expect(create.mock.calls[0][0].data.summary).toContain("99");
  });
});
