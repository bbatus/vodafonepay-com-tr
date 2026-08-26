import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, orderField } from "@/hooks/ordering";

/**
 * Generic content block for the several small, one-off sections that used to
 * be hardcoded arrays inside components (StepPhones, AppFeatures,
 * EarnWithCard, FeatureHighlights, VideoGuideSection, VideosWithTabs,
 * BrandLogoGrid). A dedicated collection per component would mean 7+ nearly
 * identical collections; `page` + `blockType` scope a single flexible one
 * instead, matching the `page`-scoped pattern FeatureCards/StepCards already
 * use elsewhere in this CMS.
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
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    {
      name: "page",
      type: "text",
      required: true,
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
      options: [
        { label: { tr: "Adım (başlık + açıklama + görsel)", en: "Step (heading + text + image)" }, value: "step" },
        { label: { tr: "Slayt (açıklama + görsel)", en: "Slide (text + image)" }, value: "slide" },
        { label: { tr: "Video (başlık + YouTube ID)", en: "Video (heading + YouTube ID)" }, value: "video" },
        { label: { tr: "Logo (isim + logo)", en: "Logo (name + logo)" }, value: "logo" },
      ],
    },
    { name: "title", type: "text", admin: { description: { tr: "step / video / logo için", en: "For step / video / logo" } } },
    { name: "text", type: "textarea", admin: { description: { tr: "step / slide için", en: "For step / slide" } } },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: { description: { tr: "step / slide / logo için", en: "For step / slide / logo" } },
    },
    { name: "youtubeId", type: "text", admin: { description: { tr: "video için, örn: 7CCEsOaoH2A", en: "For video, e.g.: 7CCEsOaoH2A" } } },
    { name: "linkUrl", type: "text" },
    orderField({ collection: "content-blocks", watchPath: "page", mode: "relationship" }),
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("content-blocks", ["page"])],
    afterChange: [revalidateTag("content-blocks"), auditAfterChange("content-blocks")],
    afterDelete: [revalidateTagOnDelete("content-blocks"), auditAfterDelete("content-blocks")],
  },
};
