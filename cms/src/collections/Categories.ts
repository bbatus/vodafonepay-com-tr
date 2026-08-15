import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { dbLabel } from "@/lib/collectionLabels";

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
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description:
          "Sabit kod referansı — kaydedildikten sonra değiştirmeyin. Sadece küçük harf, rakam ve tire (-). Örnek: kart",
      },
      validate: (value: unknown) => {
        if (typeof value !== "string" || value.length === 0) return "Zorunlu alan";
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
          return "Sadece küçük harf, rakam ve tire (-) kullanabilirsiniz. Örnek: kart";
        }
        return true;
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: { description: "Filtre sekmelerinin sırasını belirler — küçük sayı önce gelir." },
    },
  ],
  hooks: {
    afterChange: [revalidateTag("categories"), auditAfterChange("categories")],
    afterDelete: [revalidateTagOnDelete("categories"), auditAfterDelete("categories")],
  },
};
