import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";

export const LegalPages: CollectionConfig = {
  slug: "legal-pages",
  labels: {
    singular: dbLabel("collectionLabel.legal-pages.singular", { tr: "Hukuki Sayfa", en: "Legal Page" }),
    plural: dbLabel("collectionLabel.legal-pages.plural", { tr: "Hukuki Sayfalar", en: "Legal Pages" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["title", "slug"],
    group: { tr: "Site Yapısı", en: "Site Structure" },
    description:
      "Bu yasal sayfaların tablo/liste gibi yapısal kısımları kodda sabit kalır; burada yönetilen sadece giriş metnidir.",
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "legal-pages" } }],
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
    {
      name: "documents",
      type: "array",
      admin: {
        description:
          "Yalnızca Sözleşmeler ve Formlar sayfası için: indirilebilir belge listesi. Sırası, yukarıdaki 'Giriş Metni' alanındaki satır sırasıyla eşleşmeli (1. satır → 1. belge, vb.).",
      },
      fields: [
        { name: "label", type: "text", required: true },
        { name: "file", type: "upload", relationTo: "documents", required: true },
      ],
    },
    {
      // RFP §3.1.7: "Each content item should have a deeplink field in
      // order to enable redirection." Data-model only for now — each legal
      // page is its own hand-authored route file (5 separate page.tsx's,
      // not one shared template), so wiring this in is 5 small site edits
      // rather than one; left as a follow-up.
      name: "deeplink",
      type: "text",
      label: { tr: "İlgili Bağlantı", en: "Related Link" },
      admin: {
        description: {
          tr: "Opsiyonel — ileride sayfanın altında gösterilecek ilgili bir bağlantı için ayrılmış alan (site tarafında henüz render edilmiyor).",
          en: "Optional — reserved for a related link to be shown below the page (not yet rendered on the site).",
        },
      },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    afterChange: [revalidateTag("legal-pages"), auditAfterChange("legal-pages")],
    afterDelete: [revalidateTagOnDelete("legal-pages"), auditAfterDelete("legal-pages")],
  },
};
