import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";

export const FeatureCards: CollectionConfig = {
  slug: "feature-cards",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "page", "order"],
    group: "Ürün Sayfaları",
    components: {
      beforeList: [{ path: "/components/ReorderWidget#default", clientProps: { collection: "feature-cards" } }],
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
    { name: "page", type: "text", required: true, admin: { description: "Örn: vodafone-pay-uygulama, faturana-yansit" } },
    { name: "icon", type: "upload", relationTo: "media", required: true },
    { name: "title", type: "text", required: true },
    { name: "text", type: "textarea", required: true },
    { name: "deeplink", type: "text", admin: { description: "Kart tıklanınca gidilecek sayfa/deeplink (opsiyonel)." } },
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("feature-cards"), auditAfterChange("feature-cards")],
    afterDelete: [revalidateTagOnDelete("feature-cards"), auditAfterDelete("feature-cards")],
  },
};
