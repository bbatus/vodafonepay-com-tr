import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import { setOwnerOnCreate } from "@/hooks/ownership";

function fakeReq(userId?: string | number): PayloadRequest {
  return { user: userId ? { id: userId } : undefined } as unknown as PayloadRequest;
}

describe("setOwnerOnCreate", () => {
  it("stamps the field with the acting user's id on create", () => {
    const hook = setOwnerOnCreate("uploadedBy");
    const data = hook({ data: {}, operation: "create", req: fakeReq(7) } as never);
    expect(data.uploadedBy).toBe(7);
  });

  it("does not touch the field on update", () => {
    const hook = setOwnerOnCreate("uploadedBy");
    const data = hook({ data: { uploadedBy: 1 }, operation: "update", req: fakeReq(7) } as never);
    expect(data.uploadedBy).toBe(1);
  });

  it("leaves the field untouched when there is no authenticated user", () => {
    const hook = setOwnerOnCreate("uploadedBy");
    const data = hook({ data: {}, operation: "create", req: fakeReq() } as never);
    expect(data.uploadedBy).toBeUndefined();
  });
});
