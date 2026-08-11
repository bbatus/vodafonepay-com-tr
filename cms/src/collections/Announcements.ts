import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";

export const Announcements: CollectionConfig = {
  slug: "announcements",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "order", "_status"],
    group: "İçerik",
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    { name: "title", type: "text", required: true, admin: { description: "Örn: 18.08.2026 02:00-08:00 Vodafone Pay Planlı Altyapı Çalışması" } },
    { name: "body", type: "textarea", required: true, admin: { description: "Paragraflar arasına boş satır bırakın." } },
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("announcements")],
    afterDelete: [revalidateTagOnDelete("announcements")],
  },
};
