import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { isNewVerticalMaker, ROLES } from "@/access/roles";
import { dbLabel, refreshLabelCache } from "@/lib/collectionLabels";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

/**
 * Marks a row as "an editor typed this", which is what lets `onInit` tell the
 * difference between a row it seeded itself and one someone deliberately
 * customized (see payload.config.ts).
 *
 * The discriminator is `req.user`: the seeder writes with `overrideAccess:
 * true` and no authenticated user, while every save from the admin panel or
 * the REST API carries one.
 */
const markCustomized: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user) data.isCustomized = true;
  return data;
};

/**
 * RFP feedback 3.2: "localization için kullandığımız her şeyi bi database
 * tablosunda mı tutsak" — every custom admin component's UI microcopy
 * (sidebar labels, button text, hero headlines, etc.) is DB-editable here
 * instead of hardcoded in each component's `STRINGS` object. Those
 * `STRINGS` objects stay in the code as fallback/seed defaults (see
 * `cms/src/lib/translationDefaults.ts`) — if a row is missing or the fetch
 * fails, the component still renders correctly, it just isn't
 * DB-overridable until a row exists.
 *
 * Deliberately NOT in scope: Payload's own built-in admin UI strings (menus,
 * validation messages — those come from `@payloadcms/translations`'
 * tr/en packages, a framework-level i18n system this app doesn't own) and
 * the large structured help content in `cms/src/lib/helpContent.ts` (that's
 * genuinely a content module — per-collection how-to articles — not short
 * UI microcopy, and belongs in its own dedicated collection if it ever
 * needs DB-editing, not bolted onto this one).
 */
export const Translations: CollectionConfig = {
  slug: "translations",
  labels: {
    singular: dbLabel("collectionLabel.translations.singular", { tr: "Çeviri", en: "Translation" }),
    plural: dbLabel("collectionLabel.translations.plural", { tr: "Çeviriler", en: "Translations" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "key",
    defaultColumns: ["key", "tr", "en"],
    group: { tr: "Sistem", en: "System" },
    description:
      "Admin panelindeki özel bileşenlerin (sidebar, butonlar, login ekranı vb.) metinleri. 'key' değerini değiştirmeyin — kod bu değere göre metni bulur.",
    // Follow-up 25.08: "business/product bu key'i nereden bilecek ki, bunu
    // arkaplanda tutalım" — fair point, a raw `loginBrandPanel.headline`-style
    // key means nothing without reading the code. Hidden from the sidebar
    // (and the collection list/document routes) for every role except New
    // Vertical Maker, who's the one actually wiring these keys into new
    // components. Read access below STAYS public (see its own comment) —
    // this only hides the collection as a place non-maker roles browse to,
    // it doesn't block the fetches every role's own UI depends on.
    hidden: ({ user }) => (user as { role?: string } | undefined)?.role !== ROLES.NEW_VERTICAL_MAKER,
  },
  access: {
    // Every role's admin UI — not just New Vertical Maker's — renders its
    // own custom components' button labels/help text by fetching this
    // collection (see useDbStrings/loadDbStrings); narrowing this to
    // isNewVerticalMaker would silently break every OTHER role's UI text,
    // not just hide a collection from them. `admin.hidden` above is what
    // actually answers "business/product'un görmesi mantıksız" — read access
    // has to stay open for the app to keep functioning.
    read: () => true,
    create: isNewVerticalMaker,
    update: isNewVerticalMaker,
    delete: isNewVerticalMaker,
  },
  fields: [
    {
      name: "key",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Bileşen kodu bu değere göre metni bulur — örn. loginBrandPanel.headline" },
    },
    { name: "tr", type: "text", required: true, label: "Türkçe" },
    { name: "en", type: "text", required: true, label: "English" },
    {
      name: "isCustomized",
      type: "checkbox",
      defaultValue: false,
      label: { tr: "Elle düzenlendi", en: "Edited by hand" },
      admin: {
        position: "sidebar",
        readOnly: true,
        description: {
          tr: "İşaretliyse bu satırı bir editör değiştirmiştir ve koddaki varsayılan güncellemeleri artık bu satırın üzerine yazmaz.",
          en: "When checked, an editor changed this row and code-default updates will no longer overwrite it.",
        },
      },
    },
  ],
  hooks: {
    beforeChange: [markCustomized],
    // Collection/group labels are read from a module-level cache (see
    // collectionLabels.ts) rather than a fresh DB query on every sidebar
    // render — refresh it whenever a row actually changes.
    //
    // `revalidateTag("translations")` is the one exception to the "admin-only"
    // scope note above: the public site's shared "Tümü" filter-tab label
    // (src/lib/cms.ts's getTranslation, key "filterTabs.all") reads a row
    // from this same collection, so an edit here has to notify the site too,
    // not just refresh the admin's own label cache.
    afterChange: [
      async ({ req }) => {
        await refreshLabelCache(req.payload);
      },
      revalidateTag("translations"),
    ],
    afterDelete: [
      async ({ req }) => {
        await refreshLabelCache(req.payload);
      },
      revalidateTagOnDelete("translations"),
    ],
  },
};
