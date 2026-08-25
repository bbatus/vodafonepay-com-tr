import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, ORDER_FIELD_DESCRIPTION } from "@/hooks/ordering";

export const StepCards: CollectionConfig = {
  slug: "step-cards",
  labels: {
    singular: dbLabel("collectionLabel.step-cards.singular", { tr: "Adım Kartı", en: "Step Card" }),
    plural: dbLabel("collectionLabel.step-cards.plural", { tr: "Adım Kartları", en: "Step Cards" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  admin: {
    hideAPIURL: true,
    useAsTitle: "text",
    defaultColumns: ["page", "number", "order"],
    group: { tr: "Ürün Sayfaları", en: "Product Pages" },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "step-cards" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "step-cards", groupField: "page" } },
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
    {
      name: "page",
      type: "text",
      required: true,
      admin: { description: { tr: "Örn: qr-ile-faturana-yansit, aninda-bakiye", en: "E.g.: qr-ile-faturana-yansit, aninda-bakiye" } },
    },
    { name: "number", type: "text", required: true },
    { name: "text", type: "textarea", required: true },
    { name: "image", type: "upload", relationTo: "media", required: true },
    {
      name: "deeplink",
      type: "text",
      admin: {
        description: { tr: "Adım tıklanınca gidilecek sayfa/deeplink (opsiyonel).", en: "Page/deeplink to go to when the step is clicked (optional)." },
      },
    },
    {
      name: "order",
      type: "number",
      label: { tr: "Sıra", en: "Order" },
      // Deliberately NO defaultValue. Payload populates defaults BEFORE
      // beforeChange runs, so a `defaultValue: 1` here arrives at
      // assignNextOrder looking exactly like a number the editor typed —
      // the hook's "respect an explicit value" guard then bails out and the
      // auto-numbering never happens. Caught live: a new FAQ in a category
      // whose highest order was 12 was still being saved as 1. Leaving this
      // empty is also the honest UI, and matches the field description:
      // blank means "put it at the end", which is what the hook then does.
      min: 1,
      admin: {
        description: ORDER_FIELD_DESCRIPTION,
        components: {
          Field: {
            path: "/components/LiveOrderField#default",
            clientProps: { collection: "step-cards", watchPath: "page", mode: "relationship" },
          },
        },
      },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("step-cards", ["page"])],
    afterChange: [revalidateTag("step-cards"), auditAfterChange("step-cards")],
    afterDelete: [revalidateTagOnDelete("step-cards"), auditAfterDelete("step-cards")],
  },
};
