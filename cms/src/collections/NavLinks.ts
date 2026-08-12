import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";

export const NavLinks: CollectionConfig = {
  slug: "nav-links",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "href", "section", "order"],
    group: "Site Yapısı",
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "nav-links" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "nav-links", groupField: "section" } },
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
    { name: "label", type: "text", required: true },
    { name: "href", type: "text", required: true },
    {
      name: "section",
      type: "select",
      required: true,
      options: [
        { label: "Header — Ürünler", value: "header-products" },
        { label: "Header — Ana Menü", value: "header-main" },
        { label: "Footer — Kurumsal", value: "footer-kurumsal" },
        { label: "Footer — Sık Sorulanlar", value: "footer-sss" },
        { label: "Footer — Kampanyalar", value: "footer-kampanyalar" },
        { label: "Footer — Yasal", value: "footer-yasal" },
      ],
    },
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("nav-links"), auditAfterChange("nav-links")],
    afterDelete: [revalidateTagOnDelete("nav-links"), auditAfterDelete("nav-links")],
  },
};
