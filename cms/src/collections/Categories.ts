import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { blockDeleteIfReferenced } from "@/hooks/referentialIntegrity";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, ORDER_FIELD_DESCRIPTION } from "@/hooks/ordering";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";

/**
 * E1: slug is now auto-generated from `label` — never typed by hand, so a
 * category name can't drift from the technical key the site's FilterTabs
 * mapping relies on. Only fires on CREATE: an existing category's slug is
 * deliberately never re-derived, even if the label changes later, because
 * the site filters campaigns by slug — silently changing it out from under
 * an already-published campaign would break its category filter with no
 * warning.
 */
const generateSlug: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== "create" || !data?.label) return data;
  const base = turkishSlugify(data.label as string);
  data.slug = await uniqueSlug(base, async (candidate) => {
    const { totalDocs } = await req.payload.count({
      collection: "categories",
      where: { slug: { equals: candidate } },
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
 */
export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: dbLabel("collectionLabel.categories.singular", { tr: "Kategori", en: "Category" }),
    plural: dbLabel("collectionLabel.categories.plural", { tr: "Kategoriler", en: "Categories" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  admin: {
    hideAPIURL: true,
    useAsTitle: "label",
    defaultColumns: ["label", "slug", "order"],
    group: { tr: "İçerik", en: "Content" },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "categories" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "categories" } },
      ],
    },
  },
  access: {
    read: () => true,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      admin: { description: "Filtre sekmesinde ve kampanya listesinde görünen isim. Örnek: Kart" },
    },
    {
      // E1: auto-generated from `label` on create (see generateSlug above)
      // — readOnly so no one can hand-type a value that drifts from what
      // the site's FilterTabs mapping actually indexes on.
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Otomatik üretilir (isimden) — teknik referans, kaydedildikten sonra değişmez.",
      },
    },
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
      admin: { description: ORDER_FIELD_DESCRIPTION },
    },
  ],
  hooks: {
    beforeValidate: [generateSlug],
    beforeChange: [assignNextOrder("categories")],
    // RFP feedback 5.1 (the reported bug): a category with campaigns in it
    // could be deleted with no warning, silently NULLing every one of those
    // campaigns' `required` category field.
    beforeDelete: [blockDeleteIfReferenced("categories")],
    afterChange: [revalidateTag("categories"), auditAfterChange("categories")],
    afterDelete: [revalidateTagOnDelete("categories"), auditAfterDelete("categories")],
  },
};
