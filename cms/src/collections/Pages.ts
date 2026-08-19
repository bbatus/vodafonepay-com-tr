import { APIError } from "payload";
import type { Access, Block, CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig, Where } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { sitePreviewUrl } from "@/lib/preview";
import { dbLabel } from "@/lib/collectionLabels";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";

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

/**
 * Butterfly-parity gap-fill (docs/PAGE-CREATE-PRODUCTION.MD analysis,
 * docs/RFP-OPEN-ITEMS.md §8): slug used to be a required, hand-typed field —
 * every other slugged collection (BlogPosts, Categories) already
 * auto-generates from `title` via `turkishSlugify`/`uniqueSlug`. Same
 * pattern here: only fires on create, never re-derives on update so a
 * published page's URL can't shift under an editor fixing a title typo.
 */
export const generateSlug: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== "create" || !data?.title) return data;
  const base = turkishSlugify(data.title as string);
  data.slug = await uniqueSlug(base, async (candidate) => {
    const { totalDocs } = await req.payload.count({
      collection: "pages",
      where: { slug: { equals: candidate } },
      overrideAccess: true,
    });
    return totalDocs > 0;
  });
  return data;
};

/** Same `createdBy` provenance pattern as Campaigns.ts — set once, on create, never editable after. */
export const setCreatedBy: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === "create" && req.user?.id) {
    data.createdBy = req.user.id;
  }
  return data;
};

/**
 * `parent`'s admin `filterOptions` (below) already hides a document from
 * its own parent dropdown, but that's UI-only — a direct API call could
 * still set `parent` to the document's own id. Server-side guard, same
 * reasoning as every other filterOptions pairing in this codebase (see
 * Categories/BlogPosts' `filterOptions` comments).
 */
export const preventSelfParent: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  const targetId = originalDoc?.id;
  if (targetId != null && data?.parent != null && String(data.parent) === String(targetId)) {
    const message = req.i18n?.language === "en" ? "A page cannot be its own parent." : "Bir sayfa kendi üst sayfası olamaz.";
    throw new APIError(message, 400, undefined, true);
  }
  return data;
};

/**
 * Butterfly-parity gap-fill: `visibility` (public/private). Reuses
 * `publishedOrAuthenticated`'s exact logic (logged-in CMS users and the
 * site's preview-secret fetch see everything regardless of status) and
 * layers one more constraint on top for anonymous readers — public API
 * requests only ever see `visibility: "public"` pages, same shape as the
 * existing `_status: "published"` constraint. A private page therefore
 * never reaches `getPageBySlug`/`getPages` on the public site (both fetch
 * unauthenticated), so it 404s for visitors and is invisible to
 * `generateStaticParams`/sitemap.ts — no site-side gating code needed, the
 * access function is the only thing that has to know about `visibility`.
 */
export const pagesRead: Access = (args) => {
  const base = publishedOrAuthenticated(args);
  if (base === true) return true;
  return { and: [base as Where, { visibility: { equals: "public" } }] };
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
    read: pagesRead,
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
      admin: { readOnly: true, description: "URL için otomatik oluşturulur: /{slug}" },
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
    {
      // Butterfly-parity gap-fill: simple parent reference for a breadcrumb
      // trail (Ana Sayfa > Üst Sayfa > Bu Sayfa) — deliberately NOT full
      // nested routing (URL stays flat /{slug}); site menu hierarchy is
      // already NavLinks' job, this is purely a breadcrumb/grouping aid.
      name: "parent",
      type: "relationship",
      relationTo: "pages",
      label: { tr: "Üst Sayfa", en: "Parent Page" },
      admin: {
        position: "sidebar",
        description: {
          tr: "Sadece breadcrumb'da gösterilir (Ana Sayfa > Üst Sayfa > Bu Sayfa) — URL /{slug} olarak düz kalır.",
          en: "Only affects the breadcrumb trail (Home > Parent > This page) — the URL stays flat at /{slug}.",
        },
      },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    {
      // Butterfly-parity gap-fill: public/private visibility, independent of
      // draft/published — a private+published page still counts as "live"
      // in every editorial workflow, it's just never served to an
      // unauthenticated site visitor (see `pagesRead` above).
      name: "visibility",
      type: "select",
      defaultValue: "public",
      label: { tr: "Görünürlük", en: "Visibility" },
      options: [
        { label: { tr: "Herkese Açık", en: "Public" }, value: "public" },
        { label: { tr: "Gizli (yalnızca CMS oturumu ile görünür)", en: "Private (only visible with a CMS session)" }, value: "private" },
      ],
      admin: {
        position: "sidebar",
        description: {
          tr: "Gizli sayfa yayınlansa bile ziyaretçilere gösterilmez, sitemap/statik derlemeye dahil edilmez — sadece giriş yapmış CMS kullanıcıları veya önizleme bağlantısıyla görülebilir.",
          en: "A private page is never served to visitors even when published, and is excluded from the sitemap/static build — only logged-in CMS users or the preview link can see it.",
        },
      },
    },
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
    beforeValidate: [generateSlug, preventSelfParent],
    beforeChange: [setCreatedBy],
    afterChange: [revalidateTag("pages"), auditAfterChange("pages")],
    afterDelete: [revalidateTagOnDelete("pages"), auditAfterDelete("pages")],
  },
};
