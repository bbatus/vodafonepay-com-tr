import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchExportDocs, pingExportAudit } from "@/lib/exportFetch";

const okJson = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

/**
 * The cms package's vitest environment is "node" (no jsdom dependency), and
 * the module under test only ever reads `window.location.search` — a
 * minimal stub is enough, no need to pull in a whole DOM implementation for
 * one property read.
 */
function stubLocationSearch(search: string) {
  vi.stubGlobal("window", { location: { search } });
}

describe("fetchExportDocs", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    stubLocationSearch("");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the docs array on success", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [{ id: "1" }] }));
    const docs = await fetchExportDocs({ collection: "campaigns", defaultSort: "-createdAt", depth: 0, locale: "tr" });
    expect(docs).toEqual([{ id: "1" }]);
  });

  it("returns an empty array when the response has no docs key", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({}));
    const docs = await fetchExportDocs({ collection: "campaigns", defaultSort: "-createdAt", depth: 0, locale: "tr" });
    expect(docs).toEqual([]);
  });

  it("overrides limit to carry every matching row, not just the visible page", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await fetchExportDocs({ collection: "campaigns", defaultSort: "-createdAt", depth: 0, locale: "tr" });
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("limit=10000");
  });

  it("falls back to defaultSort when the page URL carries none", async () => {
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));
    await fetchExportDocs({ collection: "campaigns", defaultSort: "-createdAt", depth: 0, locale: "tr" });
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("sort=-createdAt");
  });

  it("forwards the list view's on-screen where/sort/search from the page URL", async () => {
    stubLocationSearch("?where=%7B%22a%22%3A1%7D&sort=title&search=foo");
    vi.mocked(fetch).mockImplementation(() => okJson({ docs: [] }));

    await fetchExportDocs({ collection: "campaigns", defaultSort: "-createdAt", depth: 0, locale: "tr" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("sort=title");
    expect(url).toContain("search=foo");
    expect(url).toContain("where=");
  });

  it("throws a describable error when the response is not ok", async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({ message: "Yasak" }) } as Response)
    );
    await expect(fetchExportDocs({ collection: "campaigns", defaultSort: "-createdAt", depth: 0, locale: "tr" })).rejects.toThrow(
      "Yasak"
    );
  });
});

describe("pingExportAudit", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the collection and count to the audit export endpoint", () => {
    pingExportAudit("campaigns", 42);
    expect(fetch).toHaveBeenCalledWith(
      "/api/audit/export",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ collection: "campaigns", count: 42 }) })
    );
  });

  it("never throws even if the ping itself fails — a logging hiccup must not block a download", () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    expect(() => pingExportAudit("campaigns", 1)).not.toThrow();
  });
});
