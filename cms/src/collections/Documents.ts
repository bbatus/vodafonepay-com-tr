import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";

/** Separate from Media (which is image-only, with imageSizes/focalPoint that make no
 * sense for a PDF) — used for downloadable documents, e.g. LegalPages.documents. */
export const Documents: CollectionConfig = {
  slug: "documents",
  labels: {
    singular: dbLabel("collectionLabel.documents.singular", { tr: "Doküman", en: "Document" }),
    plural: dbLabel("collectionLabel.documents.plural", { tr: "Dokümanlar", en: "Documents" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "filename",
    group: { tr: "Sistem", en: "System" },
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "documents" } }],
    },
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
