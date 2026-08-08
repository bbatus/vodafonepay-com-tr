import type { GlobalConfig } from "payload";
import { revalidateGlobalTag } from "@/hooks/revalidate";

export const ContactInfo: GlobalConfig = {
  slug: "contact-info",
  admin: {
    group: "Site Yapısı",
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: "companyName", type: "text", required: true },
    { name: "tradeRegistryNo", type: "text", required: true },
    { name: "address", type: "textarea", required: true },
    { name: "phone", type: "text", required: true },
    { name: "kepAddress", type: "text", required: true },
    { name: "customerServiceText", type: "textarea", required: true },
    { name: "tcmbAddress", type: "textarea", required: true },
    { name: "tcmbPhone", type: "text", required: true },
    { name: "tcmbFax", type: "text", required: true },
    { name: "tcmbKep", type: "text", required: true },
    { name: "pressRelationsUrl", type: "text" },
  ],
  hooks: {
    afterChange: [revalidateGlobalTag("contact-info")],
  },
};
