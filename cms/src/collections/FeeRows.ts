import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const FeeRows: CollectionConfig = {
  slug: "fee-rows",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "value", "order"],
    group: "Ücretler & Limitler",
  },
  access: {
    read: () => true,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    { name: "label", type: "text", required: true },
    { name: "value", type: "text", required: true },
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    afterChange: [revalidateTag("fee-rows")],
    afterDelete: [revalidateTagOnDelete("fee-rows")],
  },
};
