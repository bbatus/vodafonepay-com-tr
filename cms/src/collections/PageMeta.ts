import type { CollectionConfig } from "payload";
import { denyMakerEditPublished, denyMakerPublish, standardCreate, standardDelete, standardReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { setOwnerOnCreate } from "@/hooks/ownership";
import { dbLabel } from "@/lib/collectionLabels";
import { seoKeywordsField } from "@/lib/seoFields";

/**
 * RFP §3.2.3/§3.2.4/§3.2.6: breadcrumb text and SEO meta (title/description/
 * OG image) per page, editable without a deploy. One document per static
 * route — dynamic detail routes (campaign/blog/representative) don't need
 * this, their own title already sources the breadcrumb + SEO fields.
 */
export const PageMeta: CollectionConfig = {
  slug: "page-meta",
  labels: {
    singular: dbLabel("collectionLabel.page-meta.singular", { tr: "Sayfa Meta Bilgisi", en: "Page Meta" }),
    plural: dbLabel("collectionLabel.page-meta.plural", { tr: "Sayfa Meta Bilgileri", en: "Page Metas" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "pageKey",
    defaultColumns: ["pageKey", "breadcrumbLabel", "seoTitle"],
    group: { tr: "Site Yapısı", en: "Site Structure" },
    description: {
      tr: "Sayfa başına breadcrumb metni ve SEO alanları. pageKey, sitedeki route ile birebir eşleşmeli (örn: /aninda-bakiye).",
      en: "Per-page breadcrumb text and SEO fields. pageKey must exactly match the site's route (e.g.: /aninda-bakiye).",
    },
    components: {
      edit: {
        PublishButton: "/components/MakerAwarePublishButton#default",
        SaveDraftButton: "/components/SaveOrSubmitButton#default",
      },
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "page-meta" } }],
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: standardCreate,
    update: standardReadWrite,
    delete: standardDelete,
  },
  fields: [
    {
      name: "pageKey",
      type: "text",
      required: true,
      unique: true,
      label: { tr: "Sayfa Adresi", en: "Page Key" },
      admin: { description: { tr: "Örn: /, /aninda-bakiye, /kampanyalar", en: "E.g.: /, /aninda-bakiye, /kampanyalar" } },
    },
    { name: "breadcrumbLabel", type: "text", label: { tr: "Breadcrumb Etiketi", en: "Breadcrumb Label" } },
    { name: "seoTitle", type: "text", label: { tr: "SEO Başlığı", en: "SEO Title" } },
    { name: "seoDescription", type: "textarea", label: { tr: "SEO Açıklaması", en: "SEO Description" } },
    seoKeywordsField,
    { name: "ogImage", type: "upload", relationTo: "media", label: { tr: "Paylaşım Görseli (OG)", en: "OG Image" } },
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      label: { tr: "Oluşturan", en: "Created By" },
      admin: { position: "sidebar", readOnly: true },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [setOwnerOnCreate("createdBy"), denyMakerEditPublished, denyMakerPublish],
    afterChange: [revalidateTag("page-meta"), auditAfterChange("page-meta")],
    afterDelete: [revalidateTagOnDelete("page-meta"), auditAfterDelete("page-meta")],
  },
};
