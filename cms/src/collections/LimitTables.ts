import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const LimitTables: CollectionConfig = {
  slug: "limit-tables",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "order"],
    group: "Ücretler & Limitler",
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
    { name: "order", type: "number", defaultValue: 0 },
    {
      name: "rows",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        { name: "category", type: "text", required: true },
        { name: "period", type: "text", required: true },
        { name: "unverifiedLimit", type: "text", required: true },
        { name: "verifiedLimit", type: "text", required: true },
      ],
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("limit-tables")],
    afterDelete: [revalidateTagOnDelete("limit-tables")],
  },
};
