import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, ORDER_FIELD_DESCRIPTION } from "@/hooks/ordering";

export const FeeRows: CollectionConfig = {
  slug: "fee-rows",
  labels: {
    singular: dbLabel("collectionLabel.fee-rows.singular", { tr: "Ücret Satırı", en: "Fee Row" }),
    plural: dbLabel("collectionLabel.fee-rows.plural", { tr: "Ücret Tablosu", en: "Fee Rows" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
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
    {
      name: "order",
      type: "number",
      label: { tr: "Sıra", en: "Order" },
      defaultValue: 1,
      min: 1,
      admin: { description: ORDER_FIELD_DESCRIPTION },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("fee-rows")],
    afterChange: [revalidateTag("fee-rows"), auditAfterChange("fee-rows")],
    afterDelete: [revalidateTagOnDelete("fee-rows"), auditAfterDelete("fee-rows")],
  },
};
