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
  ],
  upload: {
    mimeTypes: ["image/*"],
  },
};
