import type { CollectionBeforeOperationHook } from "payload";

/**
 * Follow-up 25.08 — a real bug found live, not a cosmetic one: a PDF
 * uploaded from a Mac with a Turkish filename ("... Şikayetleri ...
 * Yükleme ... kartıma yansımadı ...") 404'd from MinIO every time it was
 * requested, even though `mc ls` showed the exact same string sitting right
 * there in the bucket.
 *
 * Root cause: macOS normalizes filenames to Unicode NFD (decomposed —
 * "ş" stored as "s" + a separate combining cedilla codepoint) when a file is
 * picked through a native file dialog, so `File.name` in the browser already
 * arrives NFD-decomposed. Payload's `generateFileData.js` uses that string
 * as-is (via `sanitize-filename`, which doesn't touch Unicode normalization)
 * to build the S3 object key. Everywhere else in the stack — Next's own URL
 * handling, most other OSes, most other tools — normalizes to NFC
 * (composed) by default. The two forms render IDENTICALLY in a terminal or
 * a browser address bar, so this is invisible by inspection; they only
 * differ byte-for-byte, which is exactly why `mc ls` (which just prints
 * whatever bytes it's given) "found" the file while a fresh GET for the
 * NFC-normalized version of the same-looking name 404'd.
 *
 * Fix: normalize the filename to NFC BEFORE Payload ever turns it into a
 * storage key — in `beforeOperation`, the one hook that runs early enough
 * (confirmed against generateFileData.js: it reads `req.file.name` directly,
 * and `beforeOperation` is what runs before that file, same reasoning as
 * Media.ts's `skipCropForSvg`). Every future upload gets a stable, NFC key
 * regardless of which OS/browser picked the file.
 */
export const normalizeUploadFilename: CollectionBeforeOperationHook = ({ req, args }) => {
  const file = (req as unknown as { file?: { name?: string } }).file;
  if (file?.name) {
    file.name = file.name.normalize("NFC");
  }
  return args;
};
