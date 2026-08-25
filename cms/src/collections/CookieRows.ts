import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";

export const CookieRows: CollectionConfig = {
  slug: "cookie-rows",
  labels: {
    singular: dbLabel("collectionLabel.cookie-rows.singular", { tr: "Çerez Satırı", en: "Cookie Row" }),
    plural: dbLabel("collectionLabel.cookie-rows.plural", { tr: "Çerez Satırları", en: "Cookie Rows" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "name",
    defaultColumns: ["name", "provider", "party", "category"],
    group: { tr: "Site Yapısı", en: "Site Structure" },
    description: {
      tr: "/cerez-politikasi sayfasındaki çerez tablosunun satırları.",
      en: "Rows of the cookie table on the /cerez-politikasi page.",
    },
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "cookie-rows" } }],
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
    { name: "name", type: "text", required: true },
    { name: "provider", type: "text", required: true },
    {
      name: "party",
      type: "select",
      required: true,
      options: [
        { label: { tr: "Birinci taraf", en: "First party" }, value: "Birinci taraf" },
        { label: { tr: "Üçüncü taraf", en: "Third party" }, value: "Üçüncü taraf" },
      ],
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: { tr: "Zorunlu", en: "Necessary" }, value: "Zorunlu" },
        { label: { tr: "İşlevsel", en: "Functional" }, value: "İşlevsel" },
        { label: { tr: "Performans (Analitik)", en: "Performance (Analytics)" }, value: "Performans (Analitik)" },
        { label: { tr: "Reklam/Pazarlama", en: "Advertising/Marketing" }, value: "Reklam/Pazarlama" },
      ],
    },
    { name: "description", type: "textarea", required: true },
    { name: "duration", type: "text", required: true },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("cookie-rows"), auditAfterChange("cookie-rows")],
    afterDelete: [revalidateTagOnDelete("cookie-rows"), auditAfterDelete("cookie-rows")],
  },
};
