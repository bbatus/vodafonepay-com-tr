import { describe, expect, it } from "vitest";
import { documentKindOf, isAllowedFileUrl, resolveDocumentFileUrl } from "@/lib/documentViewer";

describe("isAllowedFileUrl", () => {
  it("allows the configured upload hosts", () => {
    expect(isAllowedFileUrl("http://localhost:9000/media/x.pdf")).toBe(true);
    expect(isAllowedFileUrl("http://minio:9000/media/x.pdf")).toBe(true);
    expect(isAllowedFileUrl("http://127.0.0.1:9000/media/x.pdf")).toBe(true);
  });

  it("rejects an arbitrary external host — a document row must not become an open redirect", () => {
    expect(isAllowedFileUrl("https://evil.example.com/malware.exe")).toBe(false);
  });

  it("rejects a malformed URL instead of throwing", () => {
    expect(isAllowedFileUrl("not a url")).toBe(false);
  });
});

describe("documentKindOf", () => {
  it("classifies audio mime types as audio", () => {
    expect(documentKindOf("audio/mpeg")).toBe("audio");
  });

  it("defaults everything else — including missing mime type — to pdf", () => {
    expect(documentKindOf("application/pdf")).toBe("pdf");
    expect(documentKindOf(null)).toBe("pdf");
    expect(documentKindOf(undefined)).toBe("pdf");
  });
});

describe("resolveDocumentFileUrl", () => {
  it("returns the file's own URL when it's from an allowed host", () => {
    expect(resolveDocumentFileUrl({ url: "http://localhost:9000/media/x.pdf" })).toBe(
      "http://localhost:9000/media/x.pdf"
    );
  });

  it("returns null instead of a dead link when the file is missing", () => {
    expect(resolveDocumentFileUrl(null)).toBeNull();
    expect(resolveDocumentFileUrl({})).toBeNull();
  });

  it("returns null when the URL points somewhere uploads aren't served from", () => {
    expect(resolveDocumentFileUrl({ url: "https://evil.example.com/x.pdf" })).toBeNull();
  });
});
