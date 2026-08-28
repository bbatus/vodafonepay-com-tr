import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, orderField } from "@/hooks/ordering";

export const Announcements: CollectionConfig = {
  slug: "announcements",
  labels: {
    singular: dbLabel("collectionLabel.announcements.singular", { tr: "Duyuru", en: "Announcement" }),
    plural: dbLabel("collectionLabel.announcements.plural", { tr: "Duyurular", en: "Announcements" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["title", "order", "_status"],
    group: { tr: "İçerik Yönetimi", en: "Content Management" },
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
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Örn: 18.08.2026 02:00-08:00 Vodafone Pay Planlı Altyapı Çalışması",
          en: "E.g.: 18.08.2026 02:00-08:00 Vodafone Pay Planned Infrastructure Maintenance",
        },
      },
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      admin: { description: { tr: "Paragraflar arasına boş satır bırakın.", en: "Leave a blank line between paragraphs." } },
    },
    {
      name: "deeplink",
      type: "text",
      admin: {
        description: {
          tr: "Örn: /kampanyalar/{slug} veya bir uygulama deeplink'i — verilirse duyuru tıklanabilir olur.",
          en: "E.g.: /kampanyalar/{slug} or an app deeplink — if set, the announcement becomes clickable.",
        },
      },
    },
    orderField({ collection: "announcements", mode: "flat" }),
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("announcements")],
    afterChange: [revalidateTag("announcements"), auditAfterChange("announcements")],
    afterDelete: [revalidateTagOnDelete("announcements"), auditAfterDelete("announcements")],
  },
};
