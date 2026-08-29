import type { CollectionConfig } from "payload";
import { denyMakerEditPublished, denyMakerPublish, standardCreate, standardDelete, standardReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { setOwnerOnCreate } from "@/hooks/ownership";
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
      edit: {
        PublishButton: "/components/MakerAwarePublishButton#default",
        // Payload offers Unpublish only inside the ⋮ menu, which never renders
        // for a Checker and 403s for a Maker — see HideMenuUnpublishButton.
        UnpublishButton: "/components/HideMenuUnpublishButton#default",
        SaveDraftButton: "/components/SaveOrSubmitButton#default",
      },
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "cookie-rows" } }],
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrAuthenticated,
    readVersions: authenticated,
    create: standardCreate,
    update: standardReadWrite,
    delete: standardDelete,
  },
  fields: [
    { name: "name", type: "text", required: true, label: { tr: "Çerez Adı", en: "Name" } },
    { name: "provider", type: "text", required: true, label: { tr: "Sağlayıcı", en: "Provider" } },
    {
      name: "party",
      type: "select",
      required: true,
      label: { tr: "Taraf", en: "Party" },
      options: [
        { label: { tr: "Birinci taraf", en: "First party" }, value: "Birinci taraf" },
        { label: { tr: "Üçüncü taraf", en: "Third party" }, value: "Üçüncü taraf" },
      ],
    },
    {
      name: "category",
      type: "select",
      required: true,
      label: { tr: "Kategori", en: "Category" },
      options: [
        { label: { tr: "Zorunlu", en: "Necessary" }, value: "Zorunlu" },
        { label: { tr: "İşlevsel", en: "Functional" }, value: "İşlevsel" },
        { label: { tr: "Performans (Analitik)", en: "Performance (Analytics)" }, value: "Performans (Analitik)" },
        { label: { tr: "Reklam/Pazarlama", en: "Advertising/Marketing" }, value: "Reklam/Pazarlama" },
      ],
    },
    { name: "description", type: "textarea", required: true, label: { tr: "Açıklama", en: "Description" } },
    { name: "duration", type: "text", required: true, label: { tr: "Saklama Süresi", en: "Duration" } },
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
    afterChange: [revalidateTag("cookie-rows"), auditAfterChange("cookie-rows")],
    afterDelete: [revalidateTagOnDelete("cookie-rows"), auditAfterDelete("cookie-rows")],
  },
};
