import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { blockDeleteIfReferenced } from "@/hooks/referentialIntegrity";
import { denyMakerEditPublished, denyMakerPublish, standardCreate, standardDelete, standardReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, orderField } from "@/hooks/ordering";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";
import { setOwnerOnCreate } from "@/hooks/ownership";

/**
 * E1: slug is now auto-generated from `label` — never typed by hand, so a
 * category name can't drift from the technical key the site's FilterTabs
 * mapping relies on. Only fires on CREATE: an existing category's slug is
 * deliberately never re-derived, even if the label changes later, because
 * the site filters campaigns by slug — silently changing it out from under
 * an already-published campaign would break its category filter with no
 * warning.
 *
 * Uniqueness is scoped to `scope`, not global — "Anında Bakiye" is a real
 * category in BOTH flows (Campaigns/Blog and FAQ each need their own, per
 * the live site's own two separate taxonomies), and a global check forced
 * the second one into an ugly `aninda-bakiye-2` for no reason: the two
 * scopes are never queried together, so identical slugs in different scopes
 * can't actually collide.
 */
export const generateSlug: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== "create" || !data?.label) return data;
  const base = turkishSlugify(data.label as string);
  data.slug = await uniqueSlug(base, async (candidate) => {
    const { totalDocs } = await req.payload.count({
      collection: "categories",
      where: { and: [{ slug: { equals: candidate } }, { scope: { equals: data.scope } }] },
      overrideAccess: true,
    });
    return totalDocs > 0;
  });
  return data;
};

/**
 * RFP feedback item 1.3: Campaigns' category used to be a hardcoded
 * `select` (4 fixed options baked into code) — business had no way to add
 * or rename a category without a developer. This is a real, editable
 * collection instead; Campaigns.category is a relationship to it.
 *
 * Deliberately New-Vertical-only (not Growth-scoped): a category is
 * taxonomy shared across the whole site, not campaign content — same
 * reasoning as every other structural collection Growth doesn't touch.
 *
 * `scope` (added when FaqItems.category joined this collection, then split
 * again when BlogPosts got its own scope) keeps the three flows from
 * colliding: Campaigns', BlogPosts', and FaqItems' category pickers must
 * never offer each other's options — a "Kart" campaign category and a
 * "Vodafone Pay Kart" FAQ category look similar but point at different
 * real-site taxonomies (verified live against vodafonepay.com.tr; the FAQ
 * page's `?kategori=` slugs don't match the campaign category slugs at all
 * beyond two coincidental overlaps). Still ONE collection — still nothing
 * hardcoded — `scope` is just what lets `filterOptions` on each
 * `relationship` field narrow the picker to the categories that actually
 * apply there. See Campaigns.ts/BlogPosts.ts/FaqItems.ts's `category` field
 * for the other half of this.
 */
export const CATEGORY_SCOPES = {
  CAMPAIGN: "campaign",
  FAQ: "faq",
  // RFP follow-up: Blog used to share Campaigns' category list — that
  // matched the live site's actual taxonomy at the time (verified), but the
  // user wants Blog to have its own independently-managed list rather than
  // it being a side effect of reusing Campaigns'. `blog_posts` was verified
  // empty before this split, so there was no existing data to migrate.
  BLOG: "blog",
} as const;

export type CategoryScope = (typeof CATEGORY_SCOPES)[keyof typeof CATEGORY_SCOPES];

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: dbLabel("collectionLabel.categories.singular", { tr: "Kategori", en: "Category" }),
    plural: dbLabel("collectionLabel.categories.plural", { tr: "Kategoriler", en: "Categories" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  // Compound, not per-field: slug only needs to be unique WITHIN a scope
  // (generateSlug enforces this the same way on create) — see the `slug`
  // field comment for why a plain `unique: true` there would be wrong now.
  indexes: [{ fields: ["scope", "slug"], unique: true }],
  admin: {
    hideAPIURL: true,
    useAsTitle: "label",
    defaultColumns: ["label", "scope", "slug", "order"],
    group: { tr: "İçerik Yönetimi", en: "Content Management" },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "categories" } },
        // RFP follow-up: full-column CSV export, Turkish-Excel safe.
        "/components/CategoriesExportButton#default",
      ],
      // RFP follow-up: editor wanted the list itself first (what's actually
      // there right now), the drag-to-reorder tool below it — not the other
      // way around, which read as "here's a sorting tool" before "here's
      // what you're sorting". Same component, moved from beforeList to
      // afterList; nothing about the widget itself changed.
      afterList: [
        {
          path: "/components/ReorderWidget#default",
          clientProps: {
            collection: "categories",
            groupField: "scope",
            // `clientProps` is static config, evaluated once — it can't call
            // useAdminLocale()/useDbStrings() itself, so it hands ReorderWidget
            // both languages and lets IT pick via its own useAdminLocale() call
            // at render time. Values must match CATEGORY_SCOPES.
            groupLabels: {
              campaign: { tr: "Kampanyalar", en: "Campaigns" },
              blog: { tr: "Blog", en: "Blog" },
              faq: { tr: "Sık Sorulan Sorular", en: "FAQ" },
            },
          },
        },
      ],
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    // Follow-up 28.08: public read is now published-only (was unconditional)
    // now that a draft state exists — every pre-existing row was backfilled
    // to `_status: "published"` in the same migration, so this is not a
    // behavior change for any category that was already live.
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: standardCreate,
    update: standardReadWrite,
    delete: standardDelete,
  },
  fields: [
    {
      name: "scope",
      type: "select",
      required: true,
      defaultValue: CATEGORY_SCOPES.CAMPAIGN,
      label: { tr: "Akış", en: "Flow" },
      options: [
        { label: { tr: "Kampanyalar", en: "Campaigns" }, value: CATEGORY_SCOPES.CAMPAIGN },
        { label: { tr: "Blog", en: "Blog" }, value: CATEGORY_SCOPES.BLOG },
        { label: { tr: "Sıkça Sorulan Sorular", en: "FAQ" }, value: CATEGORY_SCOPES.FAQ },
      ],
      admin: {
        description: {
          tr: "Bu kategori hangi akışta seçilebilir olacak. Kampanyalar, Blog ve SSS'in her birinin kendi ayrı listesi var.",
          en: "Which flow can pick this category. Campaigns, Blog, and FAQ each have their own separate list.",
        },
      },
    },
    {
      // Follow-up 25.08: informational list of what already exists in the
      // flow the editor just picked — see CategoryScopePeek.tsx.
      name: "scopePeek",
      type: "ui",
      admin: { components: { Field: "/components/CategoryScopePeek#default" } },
    },
    {
      name: "label",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Filtre sekmesinde ve kampanya listesinde görünen isim. Örnek: Kart",
          en: "Name shown on the filter tab and the campaign list. E.g.: Kart",
        },
      },
    },
    {
      // E1: auto-generated from `label` on create (see generateSlug above)
      // — readOnly so no one can hand-type a value that drifts from what
      // the site's FilterTabs mapping actually indexes on.
      name: "slug",
      type: "text",
      required: true,
      // NOT globally unique any more — uniqueness is per `scope` (see the
      // compound index below and generateSlug's scoped count check). A bare
      // `unique: true` here would still be a single-column DB constraint and
      // block the exact case this is meant to allow: the same slug reused
      // across the two scopes.
      admin: {
        position: "sidebar",
        readOnly: true,
        description: {
          tr: "Otomatik üretilir (isimden) — teknik referans, kaydedildikten sonra değişmez.",
          en: "Auto-generated (from the name) — a technical reference, doesn't change after saving.",
        },
      },
    },
    orderField({ collection: "categories", watchPath: "scope", mode: "relationship" }),
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
    // Scoped per `scope` — a new campaign category and a new FAQ category
    // shouldn't compete for the same order sequence, same reasoning as
    // FaqItems' own per-category scoping.
    beforeChange: [setOwnerOnCreate("createdBy"), assignNextOrder("categories", ["scope"]), denyMakerEditPublished, denyMakerPublish],
    // RFP feedback 5.1 (the reported bug): a category with campaigns in it
    // could be deleted with no warning, silently NULLing every one of those
    // campaigns' `required` category field.
    beforeDelete: [blockDeleteIfReferenced("categories")],
    afterChange: [revalidateTag("categories"), auditAfterChange("categories")],
    afterDelete: [revalidateTagOnDelete("categories"), auditAfterDelete("categories")],
  },
};
