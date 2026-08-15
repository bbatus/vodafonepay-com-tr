import type { CollectionConfig } from "payload";
import { isNewVerticalMaker } from "@/access/roles";
import { dbLabel, refreshLabelCache } from "@/lib/collectionLabels";

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
  },
  access: {
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
  ],
  hooks: {
    // Collection/group labels are read from a module-level cache (see
    // collectionLabels.ts) rather than a fresh DB query on every sidebar
    // render — refresh it whenever a row actually changes.
    afterChange: [
      async ({ req }) => {
        await refreshLabelCache(req.payload);
      },
    ],
    afterDelete: [
      async ({ req }) => {
        await refreshLabelCache(req.payload);
      },
    ],
  },
};
