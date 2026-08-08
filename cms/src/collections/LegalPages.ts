import type { CollectionConfig } from "payload";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";

export const LegalPages: CollectionConfig = {
  slug: "legal-pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug"],
    group: "Site Yapısı",
    description:
      "Bu yasal sayfaların tablo/liste gibi yapısal kısımları kodda sabit kalır; burada yönetilen sadece giriş metnidir.",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "slug",
      type: "select",
      required: true,
      unique: true,
      options: [
        { label: "Gizlilik ve Güvenlik Politikası", value: "gizlilik-ve-guvenlik-politikasi" },
        { label: "Çerez Politikası", value: "cerez-politikasi" },
        { label: "Bilgi Güvenliği", value: "bilgi-guvenligi" },
        { label: "Sözleşmeler ve Formlar", value: "sozlesmeler-ve-formlar" },
        { label: "Web Sitesi Kullanımı Hüküm ve Şartları", value: "web-sitesi-hukum-ve-sartlari" },
      ],
    },
    { name: "title", type: "text", required: true },
    { name: "intro", type: "textarea", required: true, admin: { description: "Paragraflar arasına boş satır bırakın." } },
  ],
  hooks: {
    afterChange: [revalidateTag("legal-pages")],
    afterDelete: [revalidateTagOnDelete("legal-pages")],
  },
};
