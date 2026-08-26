import { APIError } from "payload";
import type { CollectionBeforeChangeHook, CollectionBeforeOperationHook, CollectionConfig } from "payload";
import { isNewVerticalMaker, mediaCreate, newVerticalReadWrite } from "@/access/roles";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { blockDeleteIfReferenced } from "@/hooks/referentialIntegrity";
import { dbLabel } from "@/lib/collectionLabels";
import { setOwnerOnCreate } from "@/hooks/ownership";
import { normalizeUploadFilename } from "@/hooks/normalizeUploadFilename";

/**
 * RFP feedback C1: `mediaType` is auto-derived from the uploaded file's
 * mimeType, never user-selected — a user picking the wrong type would defeat
 * the point of a reliable Tümü/Görseller/Videolar filter (MediaFilterTabs.tsx).
 * generateFileData() (Payload core) sets data.mimeType before any
 * collection beforeChange hook runs, so it's always present here on create;
 * on update it's only re-derived when a new file replaces the old one.
 */
const deriveMediaType: CollectionBeforeChangeHook = ({ data }) => {
  const mimeType = data?.mimeType as string | undefined;
  if (typeof mimeType === "string") {
    data.mediaType = mimeType.startsWith("video/") ? "video" : "image";
  }
  return data;
};

// RFP §3.1.4 "image size capability is necessary to ensure smooth
// functioning": only Users.avatar had a cap (2MB) — general Media uploads
// were unbounded. Payload's `upload` config has no built-in size-limit
// option (checked payload/dist/uploads/types.d.ts), so this is a plain
// hook, same shape as Users.ts's enforceAvatarSizeLimit. Images and videos
// get different caps since a promo video is legitimately much larger than
// any photo this CMS uses.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

// Follow-up 25.08: "gerçekten yüklemek istiyor musun diye bir onay ekranı
// olsun, engellemeyelim" — turned from a hard block into a soft one. The
// admin's stock upload widget sends the whole file in the same request that
// creates the document (confirmed live — there's no separate "attach, then
// save later" step to hook a native confirm() into), so the "are you sure"
// step is the sizeOverrideConfirmed checkbox below: oversized without it →
// blocked with a message telling the editor to check the box and save
// again; oversized WITH it checked → allowed through.
const enforceFileSizeLimit: CollectionBeforeChangeHook = ({ data, req }) => {
  const filesize = data?.filesize as number | undefined;
  if (typeof filesize !== "number") return data;
  const isVideo = typeof data?.mimeType === "string" && (data.mimeType as string).startsWith("video/");
  const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (filesize <= max || data?.sizeOverrideConfirmed === true) return data;

  const maxMb = max / (1024 * 1024);
  const isEnglish = req.i18n?.language === "en";
  const kindEn = isVideo ? "videos" : "images";
  const kindTr = isVideo ? "videolar" : "görseller";
  throw new APIError(
    isEnglish
      ? `File is too large — ${kindEn} are usually under ${maxMb}MB. Check "Upload anyway, over the size limit" in the sidebar and save again if you really want to upload it.`
      : `Dosya büyük — ${kindTr} genelde ${maxMb}MB'den küçük olur. Yine de yüklemek istiyorsanız kenar çubuğundaki "Boyut sınırını aşan dosyayı yine de yükle" kutusunu işaretleyip tekrar kaydedin.`,
    400,
    undefined,
    true
  );
};

/**
 * Follow-up 25.08: "SVG yüklemiyoruz sanırım". SVG uploads DO succeed on
 * their own — `mimeTypes: ["image/*"]` already covers `image/svg+xml`, and
 * Payload skips imageSizes generation for it automatically. What actually
 * breaks is the admin UI's crop/focal-point editor: it always sends
 * `uploadEdits` (crop + pixel dimensions) on save regardless of file type,
 * and sharp can't `extract_area` a crop rectangle computed against an SVG's
 * viewBox — reproduced live: `Error: extract_area: bad extract area`. Since
 * Payload has no per-mimetype way to disable the crop UI itself, this drops
 * any `uploadEdits` BEFORE Payload's own `generateFileData` reads them
 * (verified in `generateFileData.js`: `beforeOperation` runs first, and an
 * empty/absent `uploadEdits` short-circuits `shouldReupload` to false) — so
 * an SVG upload behaves exactly like the crop step never happened, instead
 * of crashing.
 */
const skipCropForSvg: CollectionBeforeOperationHook = ({ req, args }) => {
  const file = (req as unknown as { file?: { mimetype?: string } }).file;
  if (file?.mimetype === "image/svg+xml" && req.query && "uploadEdits" in req.query) {
    delete (req.query as Record<string, unknown>).uploadEdits;
  }
  return args;
};

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: dbLabel("collectionLabel.media.singular", { tr: "Medya", en: "Media" }),
    plural: dbLabel("collectionLabel.media.plural", { tr: "Medya", en: "Media" }),
  },
  admin: {
    hideAPIURL: true,
    group: { tr: "Sistem", en: "System" },
    description: {
      tr: "Görseller (PNG/JPG/SVG dahil) en fazla 10MB, videolar en fazla 100MB — daha büyüğü kenar çubuğundaki onay kutusuyla yüklenebilir.",
      en: "Images (PNG/JPG/SVG included) up to 10MB, videos up to 100MB — larger files can go through with the sidebar checkbox.",
    },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "media" } },
        "/components/MediaFilterTabs#default",
      ],
    },
  },
  access: {
    read: () => true,
    create: mediaCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "text",
    },
    {
      name: "mediaType",
      type: "select",
      admin: { position: "sidebar", readOnly: true },
      options: [
        { label: { tr: "Görsel", en: "Image" }, value: "image" },
        { label: { tr: "Video", en: "Video" }, value: "video" },
      ],
    },
    {
      // RFP feedback C3: who uploaded this — blank on records that existed
      // before this field was added (no backfill, see final report).
      name: "uploadedBy",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "usageUrl",
      type: "text",
      label: { tr: "Kullanım Yeri (URL)", en: "Used On (URL)" },
      admin: {
        position: "sidebar",
        description: {
          tr: "Bu görselin/videonun site üzerinde nerede kullanıldığı — serbest metin, örn: /kampanyalar#yaz-2026",
          en: "Where this image/video is used on the site — free text, e.g.: /kampanyalar#yaz-2026",
        },
      },
    },
    {
      name: "usageNote",
      type: "textarea",
      label: { tr: "Kullanım Notu", en: "Usage Note" },
      admin: {
        position: "sidebar",
        description: {
          tr: "Ek not — aşağıdaki 'Kullanıldığı Yerler' otomatik liste sadece bilinen alanları tarar, burası serbest metindir.",
          en: "Extra note — the 'Used In' auto-list below only scans known fields; this one is free text.",
        },
      },
    },
    {
      // RFP feedback C2: automatic list, alongside the manual usageUrl/
      // usageNote fields above — see MediaUsageField.tsx for which
      // collections/fields it actually scans.
      name: "usageList",
      type: "ui",
      admin: {
        position: "sidebar",
        components: { Field: "/components/MediaUsageField#default" },
      },
    },
    {
      // Follow-up 25.08 — see enforceFileSizeLimit's comment: this is the
      // "yine de yüklemek istiyor musun" confirmation, done as a real field
      // instead of a JS confirm() (the stock upload widget sends the file
      // and the rest of the form in one request, so there's no separate
      // moment to intercept with a dialog before the bytes are already
      // uploaded).
      name: "sizeOverrideConfirmed",
      type: "checkbox",
      defaultValue: false,
      label: { tr: "Boyut sınırını aşan dosyayı yine de yükle", en: "Upload anyway, over the size limit" },
      admin: {
        position: "sidebar",
        description: {
          tr: "10MB (görsel) / 100MB (video) sınırını aşan bir dosya kaydedilemez — bunu işaretleyip tekrar kaydederseniz sınıra rağmen yüklenir.",
          en: "Files over 10MB (images) / 100MB (videos) are blocked — check this and save again to upload anyway.",
        },
      },
    },
  ],
  upload: {
    // RFP §3.1.2: video content must be supported too — the homepage's
    // promo clip is a real example. PDFs go through the separate Documents
    // collection instead (imageSizes/focalPoint below don't apply to them).
    mimeTypes: ["image/*", "video/*"],
    focalPoint: true,
    imageSizes: [
      { name: "thumbnail", width: 240, height: 180, position: "centre" },
      { name: "card", width: 600, height: 400, position: "centre" },
      { name: "hero", width: 1200, height: 630, position: "centre" },
    ],
  },
  hooks: {
    beforeOperation: [normalizeUploadFilename, skipCropForSvg],
    beforeChange: [deriveMediaType, enforceFileSizeLimit, setOwnerOnCreate("uploadedBy")],
    beforeDelete: [blockDeleteIfReferenced("media")],
    afterChange: [auditAfterChange("media")],
    afterDelete: [auditAfterDelete("media")],
  },
};
