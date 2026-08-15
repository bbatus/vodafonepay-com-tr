import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { isNewVerticalMaker, mediaCreate, newVerticalReadWrite } from "@/access/roles";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
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

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: dbLabel("collectionLabel.media.singular", { tr: "Medya", en: "Media" }),
    plural: dbLabel("collectionLabel.media.plural", { tr: "Medya", en: "Media" }),
  },
  admin: {
    hideAPIURL: true,
    group: { tr: "Sistem", en: "System" },
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
    beforeChange: [deriveMediaType, setOwnerOnCreate("uploadedBy")],
    afterChange: [auditAfterChange("media")],
    afterDelete: [auditAfterDelete("media")],
  },
};
