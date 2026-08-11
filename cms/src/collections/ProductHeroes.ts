import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const ProductHeroes: CollectionConfig = {
  slug: "product-heroes",
  admin: {
    useAsTitle: "page",
    defaultColumns: ["page", "heading"],
    group: "Ürün Sayfaları",
  },
  access: {
    read: () => true,
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
    afterChange: [revalidateTag("product-heroes")],
    afterDelete: [revalidateTagOnDelete("product-heroes")],
  },
};
