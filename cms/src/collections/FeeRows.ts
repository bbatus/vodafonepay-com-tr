import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";

export const FeeRows: CollectionConfig = {
  slug: "fee-rows",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "value", "order"],
    group: "Ücretler & Limitler",
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "fee-rows" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "fee-rows" } },
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
    { name: "value", type: "text", required: true },
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("fee-rows"), auditAfterChange("fee-rows")],
    afterDelete: [revalidateTagOnDelete("fee-rows"), auditAfterDelete("fee-rows")],
  },
};
