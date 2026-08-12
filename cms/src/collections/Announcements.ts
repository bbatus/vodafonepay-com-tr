import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";

export const Announcements: CollectionConfig = {
  slug: "announcements",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "order", "_status"],
    group: "İçerik",
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "announcements" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "announcements" } },
      ],
    },
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
    {
      name: "deeplink",
      type: "text",
      admin: { description: "Örn: /kampanyalar/{slug} veya bir uygulama deeplink'i — verilirse duyuru tıklanabilir olur." },
    },
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("announcements"), auditAfterChange("announcements")],
    afterDelete: [revalidateTagOnDelete("announcements"), auditAfterDelete("announcements")],
  },
};
