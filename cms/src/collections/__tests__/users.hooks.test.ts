import { afterEach, describe, expect, it, vi } from "vitest";
import type { CollectionBeforeChangeHook, CollectionBeforeOperationHook, PayloadRequest } from "payload";
import { AuthenticationError, LockedAuth } from "payload";
import { Users } from "@/collections/Users";

/**
 * Every hook/endpoint tested here is a local const inside Users.ts, not
 * exported individually — reached the way Payload reaches it, off the
 * collection config object, same pattern as legalPages.test.ts's
 * `LegalPages.hooks.beforeValidate[0]`.
 */
const blockPasswordChange = Users.hooks!.beforeOperation![0] as CollectionBeforeOperationHook;
const enforceAvatarSizeLimit = Users.hooks!.beforeChange![0] as CollectionBeforeChangeHook;
const afterLoginHook = Users.hooks!.afterLogin![0] as (args: { req: PayloadRequest; user: unknown }) => Promise<void>;
const afterLogoutHook = Users.hooks!.afterLogout![0] as (args: { req: PayloadRequest }) => Promise<void>;
const afterOperationHook = Users.hooks!.afterOperation![0] as (args: {
  operation: string;
  req: PayloadRequest;
  result: unknown;
}) => Promise<unknown>;
const afterErrorHook = Users.hooks!.afterError![0] as (args: { error: Error; req: PayloadRequest }) => Promise<void>;
const avatarEndpoint = (Users.endpoints as { path: string; handler: (req: PayloadRequest) => Promise<Response> }[]).find(
  (e) => e.path === "/me/avatar"
)!;

function fakeReq(overrides: Partial<PayloadRequest> = {}) {
  const create = vi.fn().mockResolvedValue({});
  const updateOne = vi.fn().mockResolvedValue({});
  return {
    payload: { create, db: { updateOne } },
    headers: { get: () => null },
    i18n: { language: "tr" },
    ...overrides,
  } as unknown as PayloadRequest;
}

describe("blockPasswordChange", () => {
  it("strips password from an update's data, LDAP owns it entirely", () => {
    const args = { args: { data: { password: "new-pw", email: "x@y.com" } }, operation: "update" } as never;
    const result = blockPasswordChange(args) as { data?: Record<string, unknown> };
    expect(result.data).not.toHaveProperty("password");
    expect(result.data?.email).toBe("x@y.com");
  });

  it("leaves data untouched on create — an initial password is still needed there", () => {
    const args = { args: { data: { password: "initial-pw" } }, operation: "create" } as never;
    const result = blockPasswordChange(args) as { data?: Record<string, unknown> };
    expect(result.data).toHaveProperty("password", "initial-pw");
  });

  it("passes through an update with no password field unchanged", () => {
    const original = { data: { email: "x@y.com" } };
    const args = { args: original, operation: "update" } as never;
    expect(blockPasswordChange(args)).toBe(original);
  });
});

describe("enforceAvatarSizeLimit", () => {
  it("throws when the newly-selected avatar exceeds 2MB", async () => {
    const req = fakeReq();
    (req.payload as unknown as { findByID: ReturnType<typeof vi.fn> }).findByID = vi.fn().mockResolvedValue({ filesize: 3 * 1024 * 1024 });
    await expect(
      enforceAvatarSizeLimit({ data: { avatar: "media-1" }, req, originalDoc: {} } as never)
    ).rejects.toThrow(/2MB/);
  });

  it("allows an avatar within the limit", async () => {
    const req = fakeReq();
    (req.payload as unknown as { findByID: ReturnType<typeof vi.fn> }).findByID = vi.fn().mockResolvedValue({ filesize: 1024 });
    const data = { avatar: "media-1" };
    await expect(enforceAvatarSizeLimit({ data, req, originalDoc: {} } as never)).resolves.toBe(data);
  });

  it("skips the size check entirely when the avatar field is unchanged", async () => {
    const req = fakeReq();
    const findByID = vi.fn();
    (req.payload as unknown as { findByID: ReturnType<typeof vi.fn> }).findByID = findByID;
    const data = { avatar: "same-id" };
    await enforceAvatarSizeLimit({ data, req, originalDoc: { avatar: "same-id" } } as never);
    expect(findByID).not.toHaveBeenCalled();
  });
});

describe("afterLogin", () => {
  it("writes a login audit entry and stamps lastLogin fields", async () => {
    const req = fakeReq();
    await afterLoginHook({ req, user: { id: "1", email: "a@b.com", role: "GROWTH_MAKER" } });
    expect(req.payload.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "login" }) }));
    expect((req.payload as unknown as { db: { updateOne: ReturnType<typeof vi.fn> } }).db.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "users", id: "1", data: expect.objectContaining({ lastLoginIp: null }) })
    );
  });

  it("never lets a failed lastLogin stamp fail the login itself", async () => {
    const req = fakeReq();
    (req.payload as unknown as { db: { updateOne: ReturnType<typeof vi.fn> } }).db.updateOne = vi
      .fn()
      .mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(afterLoginHook({ req, user: { id: "1", email: "a@b.com" } })).resolves.toBeUndefined();
  });
});

describe("afterLogout", () => {
  it("writes a logout audit entry naming the actor", async () => {
    const req = fakeReq({ user: { email: "a@b.com" } } as never);
    await afterLogoutHook({ req });
    expect(req.payload.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "logout" }) }));
  });
});

describe("afterOperation (unlock audit)", () => {
  it("logs an 'unlock' entry only for the unlock operation", async () => {
    const req = fakeReq({ data: { email: "locked@b.com" } } as never);
    await afterOperationHook({ operation: "unlock", req, result: { ok: true } });
    expect(req.payload.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "unlock" }) }));
  });

  it("does nothing for any other operation", async () => {
    const req = fakeReq();
    await afterOperationHook({ operation: "update", req, result: { ok: true } });
    expect(req.payload.create).not.toHaveBeenCalled();
  });

  it("returns the original result unchanged", async () => {
    const req = fakeReq();
    const result = { ok: true };
    expect(await afterOperationHook({ operation: "read", req, result })).toBe(result);
  });
});

describe("afterError (failed-login auditing)", () => {
  it("logs 'locked' for a LockedAuth error, distinct from a plain wrong password", async () => {
    const req = fakeReq({ data: { email: "locked@b.com" } } as never);
    await afterErrorHook({ error: new LockedAuth(), req });
    expect(req.payload.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "locked" }) }));
  });

  it("logs 'login_failed' for a plain AuthenticationError", async () => {
    const req = fakeReq({ data: { email: "wrong@b.com" } } as never);
    await afterErrorHook({ error: new AuthenticationError(), req });
    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "login_failed" }) })
    );
  });

  it("ignores an unrelated error type", async () => {
    const req = fakeReq({ data: { email: "x@b.com" } } as never);
    await afterErrorHook({ error: new Error("something else"), req });
    expect(req.payload.create).not.toHaveBeenCalled();
  });

  it("does nothing when the failing request carried no attempted email", async () => {
    const req = fakeReq({ data: {} } as never);
    await afterErrorHook({ error: new AuthenticationError(), req });
    expect(req.payload.create).not.toHaveBeenCalled();
  });
});

describe("avatarUploadEndpoint", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("401s an unauthenticated request", async () => {
    const req = fakeReq();
    const res = await avatarEndpoint.handler!(req);
    expect(res.status).toBe(401);
  });

  it("400s when the request body isn't multipart form data", async () => {
    const req = fakeReq({ user: { id: "1" }, formData: vi.fn().mockRejectedValue(new Error("bad")) } as never);
    const res = await avatarEndpoint.handler!(req);
    expect(res.status).toBe(400);
  });

  it("400s when no file is attached", async () => {
    const formData = new FormData();
    const req = fakeReq({ user: { id: "1" }, formData: vi.fn().mockResolvedValue(formData) } as never);
    const res = await avatarEndpoint.handler!(req);
    expect(res.status).toBe(400);
  });

  it("400s a file over 2MB", async () => {
    const bigFile = new File([new Uint8Array(3 * 1024 * 1024)], "big.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("file", bigFile);
    const req = fakeReq({ user: { id: "1" }, formData: vi.fn().mockResolvedValue(formData) } as never);
    const res = await avatarEndpoint.handler!(req);
    expect(res.status).toBe(400);
  });

  it("400s an unsupported mime type", async () => {
    const file = new File(["x"], "x.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.set("file", file);
    const req = fakeReq({ user: { id: "1" }, formData: vi.fn().mockResolvedValue(formData) } as never);
    const res = await avatarEndpoint.handler!(req);
    expect(res.status).toBe(400);
  });

  it("uploads the media doc and attaches it to only the requesting user's own avatar field", async () => {
    const file = new File(["x"], "me.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("file", file);
    const create = vi.fn().mockResolvedValue({ id: "media-1" });
    const update = vi.fn().mockResolvedValue({ id: "1", avatar: "media-1" });
    const req = fakeReq({
      user: { id: "1", email: "a@b.com" },
      formData: vi.fn().mockResolvedValue(formData),
      payload: { create, update, db: { updateOne: vi.fn() } },
    } as never);

    const res = await avatarEndpoint.handler!(req);

    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: "media", overrideAccess: true }));
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "users", id: "1", data: { avatar: "media-1" } })
    );
  });

  it("500s and reports the real error message when the upload itself fails", async () => {
    const file = new File(["x"], "me.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("file", file);
    const req = fakeReq({
      user: { id: "1", email: "a@b.com" },
      formData: vi.fn().mockResolvedValue(formData),
      payload: { create: vi.fn().mockRejectedValue(new Error("MinIO down")), db: { updateOne: vi.fn() } },
    } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await avatarEndpoint.handler!(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.errors[0].message).toBe("MinIO down");
  });
});
