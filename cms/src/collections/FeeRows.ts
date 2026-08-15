import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";

export const FeeRows: CollectionConfig = {
  slug: "fee-rows",
  labels: {
    singular: dbLabel("collectionLabel.fee-rows.singular", { tr: "Ücret Satırı", en: "Fee Row" }),
    plural: dbLabel("collectionLabel.fee-rows.plural", { tr: "Ücret Tablosu", en: "Fee Rows" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "label",
    defaultColumns: ["label", "value", "order"],
    group: { tr: "Ücretler & Limitler", en: "Fees & Limits" },
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
