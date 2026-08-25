import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { blockDeleteIfReferenced } from "@/hooks/referentialIntegrity";
import { dbLabel } from "@/lib/collectionLabels";

/**
 * Separate from Media (which is image-only, with imageSizes/focalPoint that
 * make no sense here) — used for downloadable documents, e.g.
 * LegalPages.groups.documents. PDF + common audio types: LegalPages'
 * "Sözleşmeler ve Formlar" record needs both — a plain PDF group and a
 * "Seslendirilmiş Sözleşme ve Formlar" (voiced/audio) group, matching the
 * live vodafonepay.com.tr page's own two accordion sections.
 */
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
    // Follow-up 25.08: "dökümanlar ve hukuki sayfalar için 2 ayrı collection
    // olmasına gerek yok, sidebarda tekleşsin" — same shape as
    // FeeRows/LimitTables' `hidden: true`. LegalPages' `groups.documents.file`
    // field is a plain `type: "upload"` pointing here, whose "Yeni Oluştur"
    // button opens a document DRAWER (Payload core, not our own code) —
    // drawers default `overrideEntityVisibility: true`, so uploading/editing
    // a PDF from inside a legal page keeps working; only the standalone
    // /admin/collections/documents sidebar entry and direct routes are gone.
    hidden: true,
  },
  access: {
    read: () => true,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [],
  upload: {
    mimeTypes: ["application/pdf", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a"],
  },
  hooks: {
    beforeDelete: [blockDeleteIfReferenced("documents")],
    afterChange: [auditAfterChange("documents")],
    afterDelete: [auditAfterDelete("documents")],
  },
};
