import { describe, expect, it } from "vitest";
import type { CollectionBeforeChangeHook, CollectionBeforeOperationHook, PayloadRequest } from "payload";
import { Media } from "@/collections/Media";

const deriveMediaType = Media.hooks!.beforeChange![0] as CollectionBeforeChangeHook;
const enforceFileSizeLimit = Media.hooks!.beforeChange![1] as CollectionBeforeChangeHook;
const skipCropForSvg = Media.hooks!.beforeOperation![1] as CollectionBeforeOperationHook;

const req = (lang: "tr" | "en" = "tr") => ({ i18n: { language: lang } }) as unknown as PayloadRequest;

describe("deriveMediaType", () => {
  it("derives 'video' from a video/* mimeType", () => {
    const data: { mimeType: string; mediaType?: string } = { mimeType: "video/mp4" };
    deriveMediaType({ data, req: req() } as never);
    expect(data.mediaType).toBe("video");
  });

  it("derives 'image' from any non-video mimeType, SVG included", () => {
    const data: { mimeType: string; mediaType?: string } = { mimeType: "image/svg+xml" };
    deriveMediaType({ data, req: req() } as never);
    expect(data.mediaType).toBe("image");
  });

  it("leaves mediaType untouched when mimeType is absent (an update with no new file)", () => {
    const data: Record<string, unknown> = {};
    deriveMediaType({ data, req: req() } as never);
    expect(data).not.toHaveProperty("mediaType");
  });
});

describe("enforceFileSizeLimit", () => {
  it("allows an image under the 10MB cap", () => {
    const data = { mimeType: "image/png", filesize: 5 * 1024 * 1024 };
    expect(() => enforceFileSizeLimit({ data, req: req() } as never)).not.toThrow();
  });

  it("blocks an image over 10MB without the override checkbox", () => {
    const data = { mimeType: "image/png", filesize: 11 * 1024 * 1024, sizeOverrideConfirmed: false };
    expect(() => enforceFileSizeLimit({ data, req: req() } as never)).toThrow(/10MB/);
  });

  it("allows an oversized image once sizeOverrideConfirmed is checked", () => {
    const data = { mimeType: "image/png", filesize: 11 * 1024 * 1024, sizeOverrideConfirmed: true };
    expect(() => enforceFileSizeLimit({ data, req: req() } as never)).not.toThrow();
  });

  it("gives videos a much higher cap (100MB) than images", () => {
    const data = { mimeType: "video/mp4", filesize: 50 * 1024 * 1024 };
    expect(() => enforceFileSizeLimit({ data, req: req() } as never)).not.toThrow();
  });

  it("blocks an oversized video too, past its own 100MB cap", () => {
    const data = { mimeType: "video/mp4", filesize: 101 * 1024 * 1024, sizeOverrideConfirmed: false };
    expect(() => enforceFileSizeLimit({ data, req: req() } as never)).toThrow(/100MB/);
  });

  it("skips the check entirely when filesize is missing (not an upload step)", () => {
    const data = { mimeType: "image/png" };
    expect(() => enforceFileSizeLimit({ data, req: req() } as never)).not.toThrow();
  });

  it("reports the size limit in English when the admin locale is English", () => {
    const data = { mimeType: "image/png", filesize: 11 * 1024 * 1024 };
    expect(() => enforceFileSizeLimit({ data, req: req("en") } as never)).toThrow(/File is too large/);
  });
});

describe("skipCropForSvg", () => {
  it("drops uploadEdits from the query for an SVG upload", () => {
    const query: Record<string, unknown> = { uploadEdits: { crop: { x: 0, y: 0 } } };
    const args = { req: { file: { mimetype: "image/svg+xml" }, query } };
    skipCropForSvg(args as never);
    expect(query).not.toHaveProperty("uploadEdits");
  });

  it("leaves uploadEdits alone for a non-SVG upload — the real crop editor must keep working", () => {
    const query: Record<string, unknown> = { uploadEdits: { crop: { x: 0, y: 0 } } };
    const args = { req: { file: { mimetype: "image/png" }, query } };
    skipCropForSvg(args as never);
    expect(query).toHaveProperty("uploadEdits");
  });

  it("does not throw when there is no file on the request at all (a non-upload operation)", () => {
    const args = { req: { query: {} } };
    expect(() => skipCropForSvg(args as never)).not.toThrow();
  });

  it("returns the (unrelated) args object unchanged", () => {
    const innerArgs = { data: { title: "unchanged" } };
    const hookArgs = { req: { file: { mimetype: "image/png" }, query: {} }, args: innerArgs };
    expect(skipCropForSvg(hookArgs as never)).toBe(innerArgs);
  });
});
