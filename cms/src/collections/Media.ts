import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, mediaCreate, newVerticalReadWrite } from "@/access/roles";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Sistem",
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
};
