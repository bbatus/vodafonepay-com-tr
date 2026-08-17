import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";

export const ProductHeroes: CollectionConfig = {
  slug: "product-heroes",
  labels: {
    singular: dbLabel("collectionLabel.product-heroes.singular", { tr: "Ürün Hero Alanı", en: "Product Hero" }),
    plural: dbLabel("collectionLabel.product-heroes.plural", { tr: "Ürün Hero Alanları", en: "Product Heroes" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "page",
    defaultColumns: ["page", "heading"],
    group: { tr: "Ürün Sayfaları", en: "Product Pages" },
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "product-heroes" } }],
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
      name: "page",
      type: "select",
      required: true,
      unique: true,
      options: [
        { label: "Anasayfa", value: "anasayfa" },
        { label: "Vodafone Pay Uygulama", value: "vodafone-pay-uygulama" },
        { label: "Vodafone Pay Kart", value: "vodafone-pay-kart" },
        { label: "QR ile Faturana Yansıt", value: "qr-ile-faturana-yansit" },
        { label: "Faturana Yansıt", value: "faturana-yansit" },
        { label: "Anında Bakiye", value: "aninda-bakiye" },
      ],
    },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "heading", type: "text", required: true },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("product-heroes"), auditAfterChange("product-heroes")],
    afterDelete: [revalidateTagOnDelete("product-heroes"), auditAfterDelete("product-heroes")],
  },
};
