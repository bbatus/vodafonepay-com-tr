import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const FeatureCards: CollectionConfig = {
  slug: "feature-cards",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "page", "order"],
    group: "Ürün Sayfaları",
  },
  access: {
    read: () => true,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    { name: "page", type: "text", required: true, admin: { description: "Örn: vodafone-pay-uygulama, faturana-yansit" } },
    { name: "icon", type: "upload", relationTo: "media", required: true },
    { name: "title", type: "text", required: true },
    { name: "text", type: "textarea", required: true },
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    afterChange: [revalidateTag("feature-cards")],
    afterDelete: [revalidateTagOnDelete("feature-cards")],
  },
};
