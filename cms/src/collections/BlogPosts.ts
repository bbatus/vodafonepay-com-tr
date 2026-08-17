import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { sitePreviewUrl } from "@/lib/preview";
import { dbLabel } from "@/lib/collectionLabels";
import { CATEGORY_SCOPES } from "@/collections/Categories";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";

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
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { position: "sidebar", readOnly: true, description: "URL için otomatik oluşturulur: /blog/{slug}" },
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
      admin: { description: "Liste kartında 361x240 (yatay/dikdörtgen) kırpılır — kare değil, yatay fotoğraf tercih edin." },
    },
    {
      // RFP follow-up: a real post here had 5988 characters in this field
      // (the entire article, no `body` at all) — the /blog listing card has
      // no way to know that's wrong, so it rendered the whole thing and blew
      // out the grid to one column. `maxLength` makes that structurally
      // impossible going forward; the description says what this field is
      // actually for so an editor reaches for `body` (now a full richText
      // editor — headings, lists, the "Vurgu" highlight, tables) for the
      // article itself instead of pasting it here.
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 200,
      admin: {
        description:
          "Liste kartında görünen kısa özet (en fazla 200 karakter) — yazının kendisi değil. Asıl içerik için aşağıdaki 'İçerik' alanını kullanın.",
      },
    },
    { name: "body", type: "richText", label: { tr: "İçerik", en: "Body" } },
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
      // RFP follow-up: used to share Campaigns' scope (it matched the live
      // site's taxonomy at the time, but that was Campaigns' list Blog
      // happened to reuse, not Blog's own). Blog now manages its own
      // category list independently — `blog_posts` was verified empty
      // before this switch, so there was no existing data to migrate.
      filterOptions: () => ({ scope: { equals: CATEGORY_SCOPES.BLOG } }),
      admin: {
        description:
          "Blog listesindeki filtre sekmesini belirler (Blog akışındaki kategoriler). Boş bırakılırsa yazı yalnızca 'Tümü' sekmesinde görünür. Listede yoksa Kategoriler'e gidip 'Akış: Blog' ile yeni bir tane oluşturun.",
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
    beforeValidate: [generateSlug],
    afterChange: [revalidateTag("blog-posts"), auditAfterChange("blog-posts")],
    afterDelete: [revalidateTagOnDelete("blog-posts"), auditAfterDelete("blog-posts")],
  },
};
