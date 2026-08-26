import { timingSafeEqual } from "node:crypto";

/** Shared by /api/preview (enable) and /api/preview/disable — both gate on the same secret, timing-safe so a byte-by-byte comparison can't leak how much of a guess matched. */
export function isValidPreviewSecret(provided: string | null): boolean {
  const expected = process.env.PREVIEW_SECRET;
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}
