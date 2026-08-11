import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { campaignsCreate, campaignsReadWrite, denyMakerPublish, isNewVerticalMaker } from "@/access/roles";

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
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: campaignsCreate,
    update: campaignsReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, admin: { description: "URL için: /kampanyalar/{slug}" } },
    { name: "description", type: "textarea", required: true },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "body", type: "richText", admin: { description: "Detay sayfasının gövde metni" } },
    { name: "terms", type: "richText", admin: { description: "Katılım koşulları / kampanya esasları" } },
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
    {
      // Named campaignStatus (not "status") to avoid colliding with
      // Payload's own internal draft/published `_status` versioning field —
      // both generate a Postgres enum keyed off the field name, and
      // "status" collided with it (confirmed live: CREATE TABLE failed with
      // "invalid input value for enum enum_campaigns_status: active").
      name: "campaignStatus",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Aktif", value: "active" },
        { label: "Süresi doldu", value: "expired" },
      ],
      admin: { description: "Süresi dolan kampanya liste sayfalarından kalkar, detay sayfası erişilebilir kalır" },
    },
    { name: "featured", type: "checkbox", defaultValue: false, label: "Bu ayın favorilerinde göster" },
    { name: "ctaLabel", type: "text", defaultValue: "Detayları gör" },
    { name: "ctaUrl", type: "text" },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
    {
      type: "row",
      fields: [
        { name: "startDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
        { name: "endDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
      ],
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [denyMakerPublish],
    afterChange: [revalidateTag("campaigns")],
    afterDelete: [revalidateTagOnDelete("campaigns")],
  },
};
