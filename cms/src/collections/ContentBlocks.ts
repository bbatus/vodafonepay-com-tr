import type { CollectionConfig } from "payload";
import { denyMakerEditPublished, denyMakerPublish, standardCreate, standardDelete, standardReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { setOwnerOnCreate } from "@/hooks/ownership";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, orderField } from "@/hooks/ordering";

/**
 * Generic content block for the several small, one-off sections that used to
 * be hardcoded arrays inside components (StepPhones, AppFeatures,
 * FeatureHighlights, BrandLogoGrid). A dedicated collection per component
 * would mean several nearly identical collections; `page` + `blockType`
 * scope a single flexible one instead.
 */
export const ContentBlocks: CollectionConfig = {
  slug: "content-blocks",
  labels: {
    singular: dbLabel("collectionLabel.content-blocks.singular", { tr: "İçerik Bloğu", en: "Content Block" }),
    plural: dbLabel("collectionLabel.content-blocks.plural", { tr: "İçerik Blokları", en: "Content Blocks" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["page", "blockType", "title", "order"],
    group: { tr: "İçerik Yönetimi", en: "Content Management" },
    description: {
      tr: "StepPhones/AppFeatures/EarnWithCard/FeatureHighlights/VideoGuideSection/VideosWithTabs/BrandLogoGrid gibi tekil bileşenlerin içerik blokları. `page` alanı hangi bileşen/sayfaya ait olduğunu belirler.",
      en: "Content blocks for one-off components like StepPhones/AppFeatures/EarnWithCard/FeatureHighlights/VideoGuideSection/VideosWithTabs/BrandLogoGrid. The `page` field determines which component/page each one belongs to.",
    },
    components: {
      edit: {
        PublishButton: "/components/MakerAwarePublishButton#default",
        SaveDraftButton: "/components/SaveOrSubmitButton#default",
      },
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "content-blocks" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "content-blocks", groupField: "page" } },
      ],
    },
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
    {
      name: "page",
      type: "text",
      required: true,
      label: { tr: "Sayfa/Grup Anahtarı", en: "Page" },
      admin: {
        description: {
          tr: "Örn: anasayfa-steps, uygulama-ayricalikli, kart-earn, brand-logos, kart-video-guide, faturana-yansit-videos",
          en: "E.g.: anasayfa-steps, uygulama-ayricalikli, kart-earn, brand-logos, kart-video-guide, faturana-yansit-videos",
        },
      },
    },
    {
      name: "blockType",
      type: "select",
      required: true,
      defaultValue: "slide",
      label: { tr: "Blok Türü", en: "Block Type" },
      options: [
        { label: { tr: "Adım (başlık + açıklama + görsel)", en: "Step (heading + text + image)" }, value: "step" },
        { label: { tr: "Slayt (açıklama + görsel)", en: "Slide (text + image)" }, value: "slide" },
        { label: { tr: "Video (başlık + YouTube ID)", en: "Video (heading + YouTube ID)" }, value: "video" },
        { label: { tr: "Logo (isim + logo)", en: "Logo (name + logo)" }, value: "logo" },
      ],
    },
    { name: "title", type: "text", label: { tr: "Başlık", en: "Title" }, admin: { description: { tr: "step / video / logo için", en: "For step / video / logo" } } },
    { name: "text", type: "textarea", label: { tr: "Metin", en: "Text" }, admin: { description: { tr: "step / slide için", en: "For step / slide" } } },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: { tr: "Görsel", en: "Image" },
      admin: { description: { tr: "step / slide / logo için", en: "For step / slide / logo" } },
    },
    { name: "youtubeId", type: "text", label: { tr: "YouTube ID", en: "YouTube ID" }, admin: { description: { tr: "video için, örn: 7CCEsOaoH2A", en: "For video, e.g.: 7CCEsOaoH2A" } } },
    { name: "linkUrl", type: "text", label: { tr: "Bağlantı Adresi", en: "Link URL" } },
    orderField({ collection: "content-blocks", watchPath: "page", mode: "relationship" }),
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
    beforeChange: [
      setOwnerOnCreate("createdBy"),
      assignNextOrder("content-blocks", ["page"]),
      denyMakerEditPublished,
      denyMakerPublish,
    ],
    afterChange: [revalidateTag("content-blocks"), auditAfterChange("content-blocks")],
    afterDelete: [revalidateTagOnDelete("content-blocks"), auditAfterDelete("content-blocks")],
  },
};
