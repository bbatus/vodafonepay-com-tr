import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";

export const CookieRows: CollectionConfig = {
  slug: "cookie-rows",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "provider", "party", "category"],
    group: "Site Yapısı",
    description: "/cerez-politikasi sayfasındaki çerez tablosunun satırları.",
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
        { label: "Birinci taraf", value: "Birinci taraf" },
        { label: "Üçüncü taraf", value: "Üçüncü taraf" },
      ],
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Zorunlu", value: "Zorunlu" },
        { label: "İşlevsel", value: "İşlevsel" },
        { label: "Performans (Analitik)", value: "Performans (Analitik)" },
        { label: "Reklam/Pazarlama", value: "Reklam/Pazarlama" },
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
