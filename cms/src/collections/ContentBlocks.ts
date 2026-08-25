import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, ORDER_FIELD_DESCRIPTION } from "@/hooks/ordering";

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
    description:
      "StepPhones/AppFeatures/EarnWithCard/FeatureHighlights/VideoGuideSection/VideosWithTabs/BrandLogoGrid gibi tekil bileşenlerin içerik blokları. `page` alanı hangi bileşen/sayfaya ait olduğunu belirler.",
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
      admin: { description: "Örn: anasayfa-steps, uygulama-ayricalikli, kart-earn, brand-logos, kart-video-guide, faturana-yansit-videos" },
    },
    {
      name: "blockType",
      type: "select",
      required: true,
      defaultValue: "slide",
      options: [
        { label: "Adım (başlık + açıklama + görsel)", value: "step" },
        { label: "Slayt (açıklama + görsel)", value: "slide" },
        { label: "Video (başlık + YouTube ID)", value: "video" },
        { label: "Logo (isim + logo)", value: "logo" },
      ],
    },
    { name: "title", type: "text", admin: { description: "step / video / logo için" } },
    { name: "text", type: "textarea", admin: { description: "step / slide için" } },
    { name: "image", type: "upload", relationTo: "media", admin: { description: "step / slide / logo için" } },
    { name: "youtubeId", type: "text", admin: { description: "video için, örn: 7CCEsOaoH2A" } },
    { name: "linkUrl", type: "text" },
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
            clientProps: { collection: "content-blocks", watchPath: "page", mode: "relationship" },
          },
        },
      },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("content-blocks", ["page"])],
    afterChange: [revalidateTag("content-blocks"), auditAfterChange("content-blocks")],
    afterDelete: [revalidateTagOnDelete("content-blocks"), auditAfterDelete("content-blocks")],
  },
};
