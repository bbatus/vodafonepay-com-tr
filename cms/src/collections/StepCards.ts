import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const StepCards: CollectionConfig = {
  slug: "step-cards",
  admin: {
    useAsTitle: "text",
    defaultColumns: ["page", "number", "order"],
    group: "Ürün Sayfaları",
  },
  access: {
    read: () => true,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    { name: "page", type: "text", required: true, admin: { description: "Örn: qr-ile-faturana-yansit, aninda-bakiye" } },
    { name: "number", type: "text", required: true },
    { name: "text", type: "textarea", required: true },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    afterChange: [revalidateTag("step-cards")],
    afterDelete: [revalidateTagOnDelete("step-cards")],
  },
};
