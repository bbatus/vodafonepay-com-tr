import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const NavLinks: CollectionConfig = {
  slug: "nav-links",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "href", "section", "order"],
    group: "Site Yapısı",
  },
  access: {
    read: () => true,
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
    { name: "order", type: "number", defaultValue: 0 },
  ],
  hooks: {
    afterChange: [revalidateTag("nav-links")],
    afterDelete: [revalidateTagOnDelete("nav-links")],
  },
};
