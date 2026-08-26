import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { Forbidden } from "payload";
import {
  auditAfterChange,
  auditAfterDelete,
  auditExportEndpoint,
  auditForbiddenAttempt,
  auditGlobalAfterChange,
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
