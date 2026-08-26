import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import { ROLES, denyRolePublish } from "@/access/roles";

/**
 * Segregation of duties: a Growth Maker may never move a campaign INTO the
 * published state.
 *
 * The last two cases are the regression this file exists for. The hook used to
 * reject any save whose resulting `_status` was "published", which also caught
 * saves on a document that was ALREADY live — so once the RFP feedback 5.4
 * unpublish flow landed, the Growth Maker's own "Yayından Kaldırma Talebi
 * Oluştur" button 403'd on the request it was there to file. Confirmed live
 * before the fix, and again after.
 */
const hook = denyRolePublish(ROLES.GROWTH_MAKER);

const req = (role: string) => ({ user: { role }, t: ((k: string) => k) as never }) as unknown as PayloadRequest;

const run = (
  data: Record<string, unknown>,
  role: string,
  opts: { operation?: "create" | "update"; originalDoc?: Record<string, unknown> } = {}
) =>
  hook({
    data,
    operation: opts.operation ?? "update",
    originalDoc: opts.originalDoc,
    req: req(role),
    collection: {} as never,
    context: {},
  } as never);

describe("denyRolePublish", () => {
  it("blocks the maker publishing a draft", async () => {
    await expect(
      run({ _status: "published" }, ROLES.GROWTH_MAKER, { originalDoc: { _status: "draft" } })
    ).rejects.toThrow();
  });

  it("blocks the maker creating something already published", async () => {
    await expect(run({ _status: "published" }, ROLES.GROWTH_MAKER, { operation: "create" })).rejects.toThrow();
  });

  it("leaves draft saves alone", async () => {
    await expect(
      run({ _status: "draft" }, ROLES.GROWTH_MAKER, { originalDoc: { _status: "draft" } })
    ).resolves.not.toThrow();
  });

  it("does not apply to other roles", async () => {
    for (const role of [ROLES.NEW_VERTICAL_MAKER, ROLES.NEW_VERTICAL_CHECKER, ROLES.GROWTH_CHECKER]) {
      await expect(run({ _status: "published" }, role, { originalDoc: { _status: "draft" } })).resolves.not.toThrow();
    }
  });

  it("allows a publication-neutral save on an ALREADY published document", async () => {
    await expect(
      run({ _status: "published", unpublishRequest: "pending" }, ROLES.GROWTH_MAKER, {
        originalDoc: { _status: "published" },
      })
    ).resolves.not.toThrow();
  });

  it("still refuses to let that relaxation republish something that had gone back to draft", async () => {
    await expect(
      run({ _status: "published" }, ROLES.GROWTH_MAKER, { originalDoc: { _status: "draft" } })
    ).rejects.toThrow();
  });
});
