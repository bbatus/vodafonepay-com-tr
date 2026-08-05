import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const FaqItems: CollectionConfig = {
  slug: "faq-items",
  admin: {
    useAsTitle: "question",
    defaultColumns: ["question", "category", "order", "_status"],
    group: "İçerik",
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
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
    afterChange: [revalidateTag("faq-items")],
    afterDelete: [revalidateTagOnDelete("faq-items")],
  },
};
