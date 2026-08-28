import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { denyMakerEditPublished, denyMakerPublish, standardCreate, standardDelete, standardReadWrite } from "@/access/roles";
import { setOwnerOnCreate } from "@/hooks/ownership";
import { sitePreviewUrl } from "@/lib/preview";
import { dbLabel } from "@/lib/collectionLabels";
import { CATEGORY_SCOPES } from "@/collections/Categories";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";
import { seoKeywordsField } from "@/lib/seoFields";

/**
 * RFP follow-up: was a manually-typed, `unique: true` text field — an
 * editor had to invent a URL-safe slug by hand (and could get it wrong the
 * same way Categories' slug used to). Same pattern as
 * Categories.ts's `generateSlug`: only fires on create, from `title`, and
 * never re-derives on update so a published post's URL can't shift under
 * an editor who's just fixing a typo in the title.
 */
const generateSlug: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== "create" || !data?.title) return data;
  const base = turkishSlugify(data.title as string);
  data.slug = await uniqueSlug(base, async (candidate) => {
    const { totalDocs } = await req.payload.count({
      collection: "blog-posts",
      where: { slug: { equals: candidate } },
      overrideAccess: true,
    });
    return totalDocs > 0;
  });
  return data;
};

export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
  labels: {
    singular: dbLabel("collectionLabel.blog-posts.singular", { tr: "Blog Yazısı", en: "Blog Post" }),
    plural: dbLabel("collectionLabel.blog-posts.plural", { tr: "Blog Yazıları", en: "Blog Posts" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["title", "category", "publishedDate", "_status"],
    group: { tr: "İçerik Yönetimi", en: "Content Management" },
    preview: (doc) => (typeof doc.slug === "string" ? sitePreviewUrl(`/blog/${doc.slug}`) : null),
    components: {
      edit: {
        PublishButton: "/components/MakerAwarePublishButton#default",
        SaveDraftButton: "/components/SaveOrSubmitButton#default",
      },
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "blog-posts" } },
        // RFP follow-up: full-column CSV export, Turkish-Excel safe.
        "/components/BlogPostsExportButton#default",
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
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: { tr: "URL için otomatik oluşturulur: /blog/{slug}", en: "Auto-generated for the URL: /blog/{slug}" },
      },
    },
    {
      // The card grid (src/components/CardListGrid.tsx) crops every cover to
      // a fixed 361x240 (~3:2, landscape) box with object-cover — a portrait
      // or square upload still renders inside that box, but loses more of
      // the image to cropping than a landscape shot would. Guidance only,
      // not enforced: RFP feedback wants editors free to upload what they
      // have, not blocked by a dimension check.
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: {
          tr: "Liste kartında 361x240 (yatay/dikdörtgen) kırpılır — kare değil, yatay fotoğraf tercih edin.",
          en: "Cropped to 361x240 (landscape) on the list card — prefer a landscape photo over a square one.",
        },
      },
    },
    {
      // RFP follow-up: `excerpt` (a separate short-summary field) removed.
      // A real post here had 5988 characters pasted into it — the entire
      // article, with `body` left empty — and even after capping it at 200
      // chars it was still an extra field an editor had to remember to fill
      // in sync with `body`. The live site's own card teaser is just the
      // article's own text, hard-truncated with an ellipsis, not a
      // separately-authored summary — so the card teaser is now derived
      // from `body` on the site side (src/lib/cms.ts's
      // `richTextToPlainText`), and there's nothing left here to duplicate.
      name: "body",
      type: "richText",
      label: { tr: "İçerik", en: "Body" },
      required: true,
    },
    {
      // Was free text, which is why /blog's filter tabs were broken: the page
      // offered the Categories taxonomy (the live vodafonepay.com.tr blog
      // filters by exactly that — Anında Bakiye / Faturana Yansıt / Kart)
      // while posts stored arbitrary strings, so no tab could ever match.
      // Making it a real relationship is what actually makes the two agree,
      // and it's the same taxonomy Campaigns.category uses.
      //
      // Safe to change now specifically because `blog_posts` was verified
      // EMPTY (0 rows) — no free-text values to migrate. Required per RFP
      // follow-up: title/body/coverImage/category must all be filled before
      // a post can be published.
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      // RFP follow-up: used to share Campaigns' scope (it matched the live
      // site's taxonomy at the time, but that was Campaigns' list Blog
      // happened to reuse, not Blog's own). Blog now manages its own
      // category list independently — `blog_posts` was verified empty
      // before this switch, so there was no existing data to migrate.
      filterOptions: () => ({ scope: { equals: CATEGORY_SCOPES.BLOG } }),
      admin: {
        description: {
          tr: "Blog listesindeki filtre sekmesini belirler (Blog akışındaki kategoriler). Listede yoksa Kategoriler'e gidip 'Akış: Blog' ile yeni bir tane oluşturun.",
          en: "Determines the filter tab on the blog list (categories in the Blog flow). If it's not in the list, go to Categories and create one with 'Flow: Blog'.",
        },
      },
    },
    {
      // Same pattern as Campaigns.ctaLabel — the card's button text is
      // editable per-post instead of always saying "Detayları gör".
      name: "ctaLabel",
      type: "text",
      defaultValue: "Detayları gör",
      label: { tr: "Buton Yazısı", en: "Button Label" },
      admin: {
        description: {
          tr: "Blog kartındaki butonun üzerinde yazacak metin. Örnek: Detayları Gör, Yazıyı Oku",
          en: "Text on the blog card's button. E.g.: Detayları Gör, Yazıyı Oku",
        },
      },
    },
    { name: "publishedDate", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
    {
      // Named postStatus (not "status") — see the same collision noted on
      // Campaigns.campaignStatus.
      name: "postStatus",
      type: "select",
      defaultValue: "active",
      options: [
        { label: { tr: "Aktif", en: "Active" }, value: "active" },
        { label: { tr: "Arşivlendi", en: "Archived" }, value: "archived" },
      ],
      admin: {
        description: {
          tr: "Arşivlenen yazı liste sayfasından kalkar, detay sayfası erişilebilir kalır",
          en: "An archived post is removed from the list page; its detail page stays reachable",
        },
      },
    },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
    seoKeywordsField,
    {
      // RFP §3.1.7: "Each content item should have a deeplink field in
      // order to enable redirection." A post's own /blog/{slug} page is
      // already its primary destination, so this is deliberately an
      // ADDITIONAL, optional related link (rendered on the post's detail
      // page) rather than something that overrides the card's own
      // navigation — see src/app/blog/[slug]/page.tsx on the site.
      name: "deeplink",
      type: "text",
      label: { tr: "İlgili Bağlantı", en: "Related Link" },
      admin: {
        description: {
          tr: "Opsiyonel — yazının altında gösterilecek ilgili bir sayfa/kampanya bağlantısı, örn: /kampanyalar/yaz-2026",
          en: "Optional — a related page/campaign link shown below the post, e.g. /kampanyalar/yaz-2026",
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
    beforeValidate: [generateSlug],
    beforeChange: [setOwnerOnCreate("createdBy"), denyMakerEditPublished, denyMakerPublish],
    afterChange: [revalidateTag("blog-posts"), auditAfterChange("blog-posts")],
    afterDelete: [revalidateTagOnDelete("blog-posts"), auditAfterDelete("blog-posts")],
  },
};
