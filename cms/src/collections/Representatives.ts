import type { CollectionConfig } from "payload";
import { denyMakerEditPublished, denyMakerPublish, standardCreate, standardDelete, standardReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { setOwnerOnCreate } from "@/hooks/ownership";
import { dbLabel } from "@/lib/collectionLabels";

export const Representatives: CollectionConfig = {
  slug: "representatives",
  labels: {
    singular: dbLabel("collectionLabel.representatives.singular", { tr: "Temsilci", en: "Representative" }),
    plural: dbLabel("collectionLabel.representatives.plural", { tr: "Temsilciler", en: "Representatives" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "businessName",
    defaultColumns: ["businessName", "province", "district", "phone"],
    group: { tr: "İçerik Yönetimi", en: "Content Management" },
    description: {
      tr: "Temsilcilik/bayi kayıtları — /temsilciliklerimiz arama formu ve /temsilci/[id] detay sayfası bu veriyi kullanır.",
      en: "Representative/dealer records — the /temsilciliklerimiz search form and the /temsilci/[id] detail page use this data.",
    },
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "representatives" } }],
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    // Follow-up 28.08: public read is now published-only (was unconditional)
    // now that a draft state exists — every pre-existing row was backfilled
    // to `_status: "published"` in the same migration, so this is not a
    // behavior change for any representative that was already live.
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: standardCreate,
    update: standardReadWrite,
    delete: standardDelete,
  },
  fields: [
    { name: "businessName", type: "text", required: true },
    { name: "repCode", type: "text", admin: { description: { tr: "Temsilci kodu, ör. 835343KGSM", en: "Representative code, e.g. 835343KGSM" } } },
    { name: "activityDescription", type: "textarea" },
    { name: "phone", type: "text" },
    { name: "mersisNo", type: "text" },
    { name: "address", type: "textarea", required: true },
    { name: "province", type: "text", required: true },
    { name: "district", type: "text", required: true },
    { name: "authorizedPerson", type: "text" },
    { name: "qrCode", type: "upload", relationTo: "media" },
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      label: { tr: "Oluşturan", en: "Created By" },
      admin: { position: "sidebar", readOnly: true },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [setOwnerOnCreate("createdBy"), denyMakerEditPublished, denyMakerPublish],
    afterChange: [revalidateTag("representatives"), auditAfterChange("representatives")],
    afterDelete: [revalidateTagOnDelete("representatives"), auditAfterDelete("representatives")],
  },
};
