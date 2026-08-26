import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import { Feedback } from "@/collections/Feedback";

const endpoints = Feedback.endpoints as { path: string; handler: (req: PayloadRequest) => Promise<Response> }[];
const submitEndpoint = endpoints.find((e) => e.path === "/submit")!;
const countEndpoint = endpoints.find((e) => e.path === "/count")!;

function fakeReq(overrides: Partial<PayloadRequest> = {}) {
  const create = vi.fn().mockResolvedValue({});
  const count = vi.fn().mockResolvedValue({ totalDocs: 3 });
  return {
    payload: { create, count },
    headers: { get: () => null },
    i18n: { language: "tr" },
    ...overrides,
  } as unknown as PayloadRequest;
}

describe("Feedback access", () => {
  it("denies read/create/update/delete for every role — the submit endpoint is the only writer", () => {
    const access = Feedback.access!;
    expect((access.read as () => boolean)()).toBe(false);
    expect((access.create as () => boolean)()).toBe(false);
    expect((access.update as () => boolean)()).toBe(false);
    expect((access.delete as () => boolean)()).toBe(false);
  });

  it("is hidden from the admin sidebar", () => {
    expect(Feedback.admin?.hidden).toBe(true);
  });
});

describe("POST /submit", () => {
  it("401s an unauthenticated request", async () => {
    const req = fakeReq({ json: vi.fn() } as never);
    const res = await submitEndpoint.handler(req);
    expect(res.status).toBe(401);
  });

  it("400s on a malformed body", async () => {
    const req = fakeReq({ user: { id: "1" }, json: vi.fn().mockRejectedValue(new Error("bad")) } as never);
    const res = await submitEndpoint.handler(req);
    expect(res.status).toBe(400);
  });

  it("400s when the message is empty/whitespace-only", async () => {
    const req = fakeReq({ user: { id: "1" }, json: vi.fn().mockResolvedValue({ message: "   " }) } as never);
    const res = await submitEndpoint.handler(req);
    expect(res.status).toBe(400);
  });

  it("stores the feedback with overrideAccess so it writes despite access.create being false", async () => {
    const create = vi.fn().mockResolvedValue({});
    const req = fakeReq({
      user: { id: "1", email: "a@b.com", role: "GROWTH_MAKER" },
      json: vi.fn().mockResolvedValue({ message: "Şunu düzeltelim", area: "Kampanyalar", pagePath: "/admin/collections/campaigns" }),
      payload: { create, count: vi.fn() },
    } as never);

    const res = await submitEndpoint.handler(req);

    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "feedback",
        overrideAccess: true,
        data: expect.objectContaining({ message: "Şunu düzeltelim", area: "Kampanyalar", userEmail: "a@b.com", userRole: "GROWTH_MAKER" }),
      })
    );
  });

  it("500s and does not crash the request when the DB write fails", async () => {
    const req = fakeReq({
      user: { id: "1", email: "a@b.com" },
      json: vi.fn().mockResolvedValue({ message: "x" }),
      payload: { create: vi.fn().mockRejectedValue(new Error("db down")), count: vi.fn() },
    } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await submitEndpoint.handler(req);

    expect(res.status).toBe(500);
  });

  it("trims the message and omits blank optional fields", async () => {
    const create = vi.fn().mockResolvedValue({});
    const req = fakeReq({
      user: { id: "1", email: "a@b.com" },
      json: vi.fn().mockResolvedValue({ message: "  Boşluklu mesaj  ", area: "   " }),
      payload: { create, count: vi.fn() },
    } as never);

    await submitEndpoint.handler(req);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ message: "Boşluklu mesaj", area: undefined }) })
    );
  });
});

describe("GET /count", () => {
  it("401s an unauthenticated request", async () => {
    const res = await countEndpoint.handler(fakeReq());
    expect(res.status).toBe(401);
  });

  it("returns just the total count — never the feedback content itself", async () => {
    const req = fakeReq({ user: { id: "1" } } as never);
    const res = await countEndpoint.handler(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ count: 3 });
  });
});
