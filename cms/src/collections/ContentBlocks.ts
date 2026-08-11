import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";

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
  admin: {
    useAsTitle: "title",
    defaultColumns: ["page", "blockType", "title", "order"],
    group: "İçerik",
    description:
      "StepPhones/AppFeatures/EarnWithCard/FeatureHighlights/VideoGuideSection/VideosWithTabs/BrandLogoGrid gibi tekil bileşenlerin içerik blokları. `page` alanı hangi bileşen/sayfaya ait olduğunu belirler.",
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
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("content-blocks"), auditAfterChange("content-blocks")],
    afterDelete: [revalidateTagOnDelete("content-blocks"), auditAfterDelete("content-blocks")],
  },
};
