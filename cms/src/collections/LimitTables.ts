import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, ORDER_FIELD_DESCRIPTION } from "@/hooks/ordering";

export const LimitTables: CollectionConfig = {
  slug: "limit-tables",
  labels: {
    singular: dbLabel("collectionLabel.limit-tables.singular", { tr: "Limit Tablosu", en: "Limit Table" }),
    plural: dbLabel("collectionLabel.limit-tables.plural", { tr: "Limit Tabloları", en: "Limit Tables" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["title", "order"],
    group: { tr: "Ücretler & Limitler", en: "Fees & Limits" },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "limit-tables" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "limit-tables" } },
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
    { name: "title", type: "text", required: true },
    {
      name: "order",
      type: "number",
      label: { tr: "Sıra", en: "Order" },
      defaultValue: 1,
      min: 1,
      admin: { description: ORDER_FIELD_DESCRIPTION },
    },
    {
      name: "rows",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        { name: "category", type: "text", required: true },
        { name: "period", type: "text", required: true },
        { name: "unverifiedLimit", type: "text", required: true },
        { name: "verifiedLimit", type: "text", required: true },
      ],
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("limit-tables")],
    afterChange: [revalidateTag("limit-tables"), auditAfterChange("limit-tables")],
    afterDelete: [revalidateTagOnDelete("limit-tables"), auditAfterDelete("limit-tables")],
  },
};
