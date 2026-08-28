import type { CollectionConfig } from "payload";
import { denyMakerEditPublished, denyMakerPublish, standardCreate, standardDelete, standardReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { setOwnerOnCreate } from "@/hooks/ownership";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, orderField } from "@/hooks/ordering";

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
    // RFP follow-up: /admin/fees-and-limits (FeesAndLimitsView.tsx) is the
    // ONLY entry point now — `hidden: true` removes this collection from
    // the sidebar AND 404s its own /admin/collections/fee-rows routes
    // (confirmed live: Payload's List/Document views check
    // `visibleEntities`, which `getVisibleEntities` excludes hidden
    // collections from). That's fine here because FeesAndLimitsApp no
    // longer links to those routes — it edits/creates fee-rows through
    // `useDocumentDrawer`, which defaults `overrideEntityVisibility: true`
    // and bypasses that exact check.
    hidden: true,
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: standardCreate,
    update: standardReadWrite,
    delete: standardDelete,
  },
  fields: [
    { name: "label", type: "text", required: true },
    { name: "value", type: "text", required: true },
    orderField({ collection: "fee-rows", mode: "flat" }),
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      label: { tr: "Oluşturan", en: "Created By" },
      admin: { position: "sidebar", readOnly: true },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [setOwnerOnCreate("createdBy"), assignNextOrder("fee-rows"), denyMakerEditPublished, denyMakerPublish],
    afterChange: [revalidateTag("fee-rows"), auditAfterChange("fee-rows")],
    afterDelete: [revalidateTagOnDelete("fee-rows"), auditAfterDelete("fee-rows")],
  },
};
