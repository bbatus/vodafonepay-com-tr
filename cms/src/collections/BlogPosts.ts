import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { sitePreviewUrl } from "@/lib/preview";
import { dbLabel } from "@/lib/collectionLabels";

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
    group: { tr: "İçerik", en: "Content" },
    preview: (doc) => (typeof doc.slug === "string" ? sitePreviewUrl(`/blog/${doc.slug}`) : null),
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "blog-posts" } }],
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
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, admin: { description: "URL için: /blog/{slug}" } },
    { name: "coverImage", type: "upload", relationTo: "media", required: true },
    { name: "excerpt", type: "textarea", required: true },
    { name: "body", type: "richText" },
    {
      // Was free text, which is why /blog's filter tabs were broken: the page
      // offered the Categories taxonomy (the live vodafonepay.com.tr blog
      // filters by exactly that — Anında Bakiye / Faturana Yansıt / Kart)
      // while posts stored arbitrary strings, so no tab could ever match.
      // Making it a real relationship is what actually makes the two agree,
      // and it's the same taxonomy Campaigns.category uses.
      //
      // Safe to change now specifically because `blog_posts` was verified
      // EMPTY (0 rows) — no free-text values to migrate. Deliberately NOT
      // `required`: the live site's blog has posts under no category too, and
      // making it required would block an editor mid-draft.
      name: "category",
      type: "relationship",
      relationTo: "categories",
      admin: {
        description:
          "Blog listesindeki filtre sekmesini belirler — kampanyalarla aynı kategori listesi. Boş bırakılırsa yazı yalnızca 'Tümü' sekmesinde görünür.",
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
        { label: "Aktif", value: "active" },
        { label: "Arşivlendi", value: "archived" },
      ],
      admin: { description: "Arşivlenen yazı liste sayfasından kalkar, detay sayfası erişilebilir kalır" },
    },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("blog-posts"), auditAfterChange("blog-posts")],
    afterDelete: [revalidateTagOnDelete("blog-posts"), auditAfterDelete("blog-posts")],
  },
};
