import type { CollectionConfig } from "payload";
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
