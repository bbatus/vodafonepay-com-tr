import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateGlobalTag, revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

describe("revalidate hooks", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SITE_REVALIDATE_URL: "http://app:3000/api/revalidate", REVALIDATE_SECRET: "s3cret" };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ status: 200 } as Response)));
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("revalidateTag POSTs the tag with the secret header", async () => {
    const hook = revalidateTag("campaigns");
    await hook({} as never);

    expect(fetch).toHaveBeenCalledWith(
      "http://app:3000/api/revalidate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-revalidate-secret": "s3cret" }),
        body: JSON.stringify({ tag: "campaigns" }),
      })
    );
  });

  it("revalidateTagOnDelete pings the same endpoint", async () => {
    const hook = revalidateTagOnDelete("blog-posts");
    await hook({} as never);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("revalidateGlobalTag pings the same endpoint", async () => {
    const hook = revalidateGlobalTag("contact-info");
    await hook({} as never);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("skips the network call when SITE_REVALIDATE_URL is missing", async () => {
    process.env.SITE_REVALIDATE_URL = "";
    const hook = revalidateTag("campaigns");
    await hook({} as never);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("skips the network call when REVALIDATE_SECRET is missing", async () => {
    process.env.REVALIDATE_SECRET = "";
    const hook = revalidateTag("campaigns");
    await hook({} as never);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not throw when the fetch itself fails (best-effort)", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network down"))));
    const hook = revalidateTag("campaigns");
    await expect(hook({} as never)).resolves.toBeUndefined();
  });
});
