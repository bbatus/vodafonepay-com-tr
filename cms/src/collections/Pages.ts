import type { Block, CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { sitePreviewUrl } from "@/lib/preview";
import { dbLabel } from "@/lib/collectionLabels";

/**
 * RFP §3.3 (Lifecycle Management) / §3.2.13 (drag-and-drop web page design):
 * the biggest gap in the earlier PoC — every page was a hand-written
 * src/app/*\/page.tsx, so a new campaign landing page meant a jira ticket +
 * a developer + a deploy, exactly the flow the RFP's Scope section says the
 * CMS is supposed to remove. This collection lets a non-technical editor
 * compose a NEW page from reusable blocks entirely from the admin UI —
 * Payload's `blocks` field type is natively add/remove/drag-to-reorder in
 * the admin, so no custom drag-and-drop UI needed to satisfy that part.
 *
 * This is deliberately NOT a replacement for the 20 existing hand-built
 * pages (aninda-bakiye, kampanyalar, etc.) — those stay as they are. Pages
 * is for NET NEW pages an editor creates going forward (promo landing
 * pages, campaign hubs) without needing a developer.
 */

const HeroBlock: Block = {
  slug: "hero",
  labels: { singular: "Hero (Başlık + Görsel)", plural: "Hero Blokları" },
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "subheading", type: "text" },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "ctaLabel", type: "text" },
    { name: "ctaUrl", type: "text" },
  ],
};

const RichTextBlock: Block = {
  slug: "richText",
  labels: { singular: "Metin Bloğu", plural: "Metin Blokları" },
  fields: [
    { name: "heading", type: "text" },
    { name: "body", type: "richText", required: true },
  ],
};

const FaqListBlock: Block = {
  slug: "faqList",
  labels: { singular: "SSS Bloğu", plural: "SSS Blokları" },
  fields: [
    { name: "heading", type: "text" },
    {
      name: "category",
      type: "text",
      admin: { description: "FaqItems'daki category değeriyle eşleşmeli (örn: kampanyalar). Boş bırakılırsa tüm SSS'ler gelir." },
    },
  ],
};

const CampaignGridBlock: Block = {
  slug: "campaignGrid",
  labels: { singular: "Kampanya Grid Bloğu", plural: "Kampanya Grid Blokları" },
  fields: [
    { name: "heading", type: "text", required: true },
    {
      name: "category",
      type: "text",
      admin: { description: "Campaigns'teki category değeriyle eşleşmeli (örn: kart). Boş bırakılırsa tüm aktif kampanyalar gelir." },
    },
  ],
};

const VideoBlock: Block = {
  slug: "video",
  labels: { singular: "Video Bloğu", plural: "Video Blokları" },
  fields: [
    { name: "heading", type: "text" },
    { name: "youtubeId", type: "text", required: true },
  ],
};

const LogoGridBlock: Block = {
  slug: "logoGrid",
  labels: { singular: "Logo Grid Bloğu", plural: "Logo Grid Blokları" },
  fields: [
    { name: "heading", type: "text" },
    {
      name: "logos",
      type: "array",
      minRows: 1,
      fields: [
        { name: "name", type: "text", required: true },
        { name: "logo", type: "upload", relationTo: "media", required: true },
        { name: "linkUrl", type: "text" },
      ],
    },
  ],
};

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: {
    singular: dbLabel("collectionLabel.pages.singular", { tr: "Sayfa", en: "Page" }),
    plural: dbLabel("collectionLabel.pages.plural", { tr: "Sayfalar", en: "Pages" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status"],
    group: { tr: "İçerik", en: "Content" },
    description: "Yeni sayfalar (kampanya landing, hub sayfası vb.) — geliştirici gerekmeden, blokları sürükleyip bırakarak oluşturulur.",
    preview: (doc) => (typeof doc.slug === "string" ? sitePreviewUrl(`/${doc.slug}`) : null),
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "pages" } }],
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
    // RFP feedback 5.7: was `localized: true` — the only localized field in the
    // whole CMS, which is why the content-locale selector appeared in the
    // header while switching it changed nothing. See payload.config.ts.
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "URL için: /{slug} — baştaki / olmadan yazın, örn: yaz-kampanyasi-2026" },
    },
    {
      name: "layout",
      type: "blocks",
      minRows: 1,
      blocks: [HeroBlock, RichTextBlock, FaqListBlock, CampaignGridBlock, VideoBlock, LogoGridBlock],
    },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
    { name: "ogImage", type: "upload", relationTo: "media" },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("pages"), auditAfterChange("pages")],
    afterDelete: [revalidateTagOnDelete("pages"), auditAfterDelete("pages")],
  },
};
