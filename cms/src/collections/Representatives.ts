import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";

export const Representatives: CollectionConfig = {
  slug: "representatives",
  admin: {
    useAsTitle: "businessName",
    defaultColumns: ["businessName", "province", "district", "phone"],
    group: "İçerik",
    description: "Temsilcilik/bayi kayıtları — /temsilciliklerimiz arama formu ve /temsilci/[id] detay sayfası bu veriyi kullanır.",
  },
  access: {
    read: () => true,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    { name: "businessName", type: "text", required: true },
    { name: "repCode", type: "text", admin: { description: "Temsilci kodu, ör. 835343KGSM" } },
    { name: "activityDescription", type: "textarea" },
    { name: "phone", type: "text" },
    { name: "mersisNo", type: "text" },
    { name: "address", type: "textarea", required: true },
    { name: "province", type: "text", required: true },
    { name: "district", type: "text", required: true },
    { name: "authorizedPerson", type: "text" },
    { name: "qrCode", type: "upload", relationTo: "media" },
  ],
  hooks: {
    afterChange: [revalidateTag("representatives"), auditAfterChange("representatives")],
    afterDelete: [revalidateTagOnDelete("representatives"), auditAfterDelete("representatives")],
  },
};
