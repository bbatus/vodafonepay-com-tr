import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { dbLabel } from "@/lib/collectionLabels";

export const FaqItems: CollectionConfig = {
  slug: "faq-items",
  labels: {
    singular: dbLabel("collectionLabel.faq-items.singular", { tr: "Sık Sorulan Soru", en: "FAQ Item" }),
    plural: dbLabel("collectionLabel.faq-items.plural", { tr: "Sık Sorulanlar", en: "FAQ Items" }),
  },
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
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("faq-items"), auditAfterChange("faq-items")],
    afterDelete: [revalidateTagOnDelete("faq-items"), auditAfterDelete("faq-items")],
  },
};
