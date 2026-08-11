import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";

/** Separate from Media (which is image-only, with imageSizes/focalPoint that make no
 * sense for a PDF) — used for downloadable documents, e.g. LegalPages.documents. */
export const Documents: CollectionConfig = {
  slug: "documents",
  admin: {
    useAsTitle: "filename",
    group: "Sistem",
  },
  access: {
    read: () => true,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [],
  upload: {
    mimeTypes: ["application/pdf"],
  },
  hooks: {
    afterChange: [auditAfterChange("documents")],
    afterDelete: [auditAfterDelete("documents")],
  },
};
