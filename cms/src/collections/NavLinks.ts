import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, ORDER_FIELD_DESCRIPTION } from "@/hooks/ordering";

export const NavLinks: CollectionConfig = {
  slug: "nav-links",
  labels: {
    singular: dbLabel("collectionLabel.nav-links.singular", { tr: "Menü Linki", en: "Nav Link" }),
    plural: dbLabel("collectionLabel.nav-links.plural", { tr: "Menü Linkleri", en: "Nav Links" }),
  },
  // RFP feedback 5.5: the list must reflect the `order` field (and the
  // drag-to-reorder widget's saved sequence), not Payload's fallback order.
  defaultSort: "order",
  admin: {
    hideAPIURL: true,
    useAsTitle: "label",
    defaultColumns: ["label", "href", "section", "order"],
    group: { tr: "Site Yapısı", en: "Site Structure" },
    components: {
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "nav-links" } },
        { path: "/components/ReorderWidget#default", clientProps: { collection: "nav-links", groupField: "section" } },
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
    { name: "label", type: "text", required: true },
    { name: "href", type: "text", required: true },
    {
      name: "section",
      type: "select",
      required: true,
      options: [
        { label: "Header — Ürünler", value: "header-products" },
        { label: "Header — Ana Menü", value: "header-main" },
        { label: "Footer — Kurumsal", value: "footer-kurumsal" },
        { label: "Footer — Sık Sorulanlar", value: "footer-sss" },
        { label: "Footer — Kampanyalar", value: "footer-kampanyalar" },
        { label: "Footer — Yasal", value: "footer-yasal" },
      ],
    },
    {
      name: "order",
      type: "number",
      label: { tr: "Sıra", en: "Order" },
      // Deliberately NO defaultValue. Payload populates defaults BEFORE
      // beforeChange runs, so a `defaultValue: 1` here arrives at
      // assignNextOrder looking exactly like a number the editor typed —
      // the hook's "respect an explicit value" guard then bails out and the
      // auto-numbering never happens. Caught live: a new FAQ in a category
      // whose highest order was 12 was still being saved as 1. Leaving this
      // empty is also the honest UI, and matches the field description:
      // blank means "put it at the end", which is what the hook then does.
      min: 1,
      admin: { description: ORDER_FIELD_DESCRIPTION },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [assignNextOrder("nav-links", ["section"])],
    afterChange: [revalidateTag("nav-links"), auditAfterChange("nav-links")],
    afterDelete: [revalidateTagOnDelete("nav-links"), auditAfterDelete("nav-links")],
  },
};
