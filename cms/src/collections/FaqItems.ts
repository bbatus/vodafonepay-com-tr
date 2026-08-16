import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, ORDER_FIELD_DESCRIPTION } from "@/hooks/ordering";

export const FaqItems: CollectionConfig = {
  slug: "faq-items",
  labels: {
    singular: dbLabel("collectionLabel.faq-items.singular", { tr: "Sık Sorulan Soru", en: "FAQ Item" }),
    plural: dbLabel("collectionLabel.faq-items.plural", { tr: "Sık Sorulanlar", en: "FAQ Items" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  admin: {
    hideAPIURL: true,
    useAsTitle: "question",
    defaultColumns: ["question", "category", "order", "_status"],
    group: { tr: "İçerik", en: "Content" },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "faq-items" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "faq-items", groupField: "category" } },
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
    { name: "question", type: "text", required: true },
    { name: "answer", type: "textarea", required: true },
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "anasayfa",
      options: [
        { label: "Anasayfa", value: "anasayfa" },
        { label: "Anında Bakiye", value: "aninda-bakiye" },
        { label: "Vodafone Pay Uygulama", value: "vodafone-pay-uygulama" },
        { label: "Vodafone Pay Kart", value: "vodafone-pay-kart" },
        { label: "QR ile Faturana Yansıt", value: "qr-ile-faturana-yansit" },
        { label: "Faturana Yansıt", value: "faturana-yansit" },
        { label: "Kampanyalar", value: "kampanyalar" },
      ],
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
      admin: { description: ORDER_FIELD_DESCRIPTION },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("faq-items", ["category"])],
    afterChange: [revalidateTag("faq-items"), auditAfterChange("faq-items")],
    afterDelete: [revalidateTagOnDelete("faq-items"), auditAfterDelete("faq-items")],
  },
};
