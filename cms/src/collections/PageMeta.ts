import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";

/**
 * RFP §3.2.3/§3.2.4/§3.2.6: breadcrumb text and SEO meta (title/description/
 * OG image) per page, editable without a deploy. One document per static
 * route — dynamic detail routes (campaign/blog/representative) don't need
 * this, their own title already sources the breadcrumb + SEO fields.
 */
export const PageMeta: CollectionConfig = {
  slug: "page-meta",
  admin: {
    useAsTitle: "pageKey",
    defaultColumns: ["pageKey", "breadcrumbLabel", "seoTitle"],
    group: "Site Yapısı",
    description: "Sayfa başına breadcrumb metni ve SEO alanları. pageKey, sitedeki route ile birebir eşleşmeli (örn: /aninda-bakiye).",
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "page-meta" } }],
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
    { name: "pageKey", type: "text", required: true, unique: true, admin: { description: "Örn: /, /aninda-bakiye, /kampanyalar" } },
    { name: "breadcrumbLabel", type: "text" },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
    { name: "ogImage", type: "upload", relationTo: "media" },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("page-meta"), auditAfterChange("page-meta")],
    afterDelete: [revalidateTagOnDelete("page-meta"), auditAfterDelete("page-meta")],
  },
};
