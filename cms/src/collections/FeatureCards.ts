import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, orderField } from "@/hooks/ordering";

export const FeatureCards: CollectionConfig = {
  slug: "feature-cards",
  labels: {
    singular: dbLabel("collectionLabel.feature-cards.singular", { tr: "Özellik Kartı", en: "Feature Card" }),
    plural: dbLabel("collectionLabel.feature-cards.plural", { tr: "Özellik Kartları", en: "Feature Cards" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["title", "page", "order"],
    group: { tr: "Ürün Sayfaları", en: "Product Pages" },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "feature-cards" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "feature-cards", groupField: "page" } },
      ],
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
    {
      name: "page",
      type: "text",
      required: true,
      admin: { description: { tr: "Örn: vodafone-pay-uygulama, faturana-yansit", en: "E.g.: vodafone-pay-uygulama, faturana-yansit" } },
    },
    { name: "icon", type: "upload", relationTo: "media", required: true },
    { name: "title", type: "text", required: true },
    { name: "text", type: "textarea", required: true },
    {
      name: "deeplink",
      type: "text",
      admin: {
        description: { tr: "Kart tıklanınca gidilecek sayfa/deeplink (opsiyonel).", en: "Page/deeplink to go to when the card is clicked (optional)." },
      },
    },
    orderField({ collection: "feature-cards", watchPath: "page", mode: "relationship" }),
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("feature-cards", ["page"])],
    afterChange: [revalidateTag("feature-cards"), auditAfterChange("feature-cards")],
    afterDelete: [revalidateTagOnDelete("feature-cards"), auditAfterDelete("feature-cards")],
  },
};
