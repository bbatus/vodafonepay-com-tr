import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const Campaigns: CollectionConfig = {
  slug: "campaigns",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "featured", "startDate", "endDate", "_status"],
    group: "İçerik",
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    { name: "image", type: "upload", relationTo: "media", required: true },
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "genel",
      options: [
        { label: "Genel", value: "genel" },
        { label: "Anında Bakiye", value: "aninda-bakiye" },
        { label: "Faturana Yansıt", value: "faturana-yansit" },
        { label: "Kart", value: "kart" },
      ],
    },
    { name: "featured", type: "checkbox", defaultValue: false, label: "Bu ayın favorilerinde göster" },
    { name: "ctaLabel", type: "text", defaultValue: "Detayları gör" },
    { name: "ctaUrl", type: "text" },
    {
      type: "row",
      fields: [
        { name: "startDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
        { name: "endDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateTag("campaigns")],
    afterDelete: [revalidateTagOnDelete("campaigns")],
  },
};
