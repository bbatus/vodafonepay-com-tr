import { APIError } from "payload";
import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { isNewVerticalMaker, mediaCreate, newVerticalReadWrite } from "@/access/roles";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { blockDeleteIfReferenced } from "@/hooks/referentialIntegrity";
import { dbLabel } from "@/lib/collectionLabels";
import { setOwnerOnCreate } from "@/hooks/ownership";

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

const enforceFileSizeLimit: CollectionBeforeChangeHook = ({ data, req }) => {
  const filesize = data?.filesize as number | undefined;
  if (typeof filesize !== "number") return data;
  const isVideo = typeof data?.mimeType === "string" && (data.mimeType as string).startsWith("video/");
  const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (filesize <= max) return data;

  const maxMb = max / (1024 * 1024);
  const isEnglish = req.i18n?.language === "en";
  throw new APIError(
    isEnglish
      ? `File is too large — ${isVideo ? "videos" : "images"} must be under ${maxMb}MB.`
      : `Dosya çok büyük — ${isVideo ? "videolar" : "görseller"} ${maxMb}MB'den küçük olmalı.`,
    400,
    undefined,
    true
  );
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
    description: { tr: "Görseller en fazla 10MB, videolar en fazla 100MB olabilir.", en: "Images up to 10MB, videos up to 100MB." },
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
        { label: "Görsel", value: "image" },
        { label: "Video", value: "video" },
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
      label: "Kullanım Yeri (URL)",
      admin: { position: "sidebar", description: "Bu görselin/videonun site üzerinde nerede kullanıldığı — serbest metin, örn: /kampanyalar#yaz-2026" },
    },
    {
      name: "usageNote",
      type: "textarea",
      label: "Kullanım Notu",
      admin: { position: "sidebar", description: "Ek not — aşağıdaki 'Kullanıldığı Yerler' otomatik liste sadece bilinen alanları tarar, burası serbest metindir." },
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
    beforeChange: [deriveMediaType, enforceFileSizeLimit, setOwnerOnCreate("uploadedBy")],
    beforeDelete: [blockDeleteIfReferenced("media")],
    afterChange: [auditAfterChange("media")],
    afterDelete: [auditAfterDelete("media")],
  },
};
