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
      "Bu yasal sayfaların tablo/liste gibi yapısal kısımları kodda sabit kalır; burada yönetilen giriş metni, ve Sözleşmeler ve Formlar için sayfa görseli + belge grupları.",
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
    { name: "intro", type: "richText", required: true },
    {
      // Follow-up 25.08: "sözleşmeler ve formlar sayfasının görselini
      // değiştirebilsin" — only meaningful for the one slug that actually
      // renders it (see the `condition` below and
      // src/app/sozlesmeler-ve-formlar/page.tsx), so it stays out of the way
      // on the other 4 (pure-prose) legal pages.
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      label: { tr: "Sayfa Görseli", en: "Page Image" },
      admin: {
        condition: (data) => data?.slug === "sozlesmeler-ve-formlar",
        description: {
          tr: "Sözleşmeler ve Formlar sayfasının başlığının üstünde gösterilir. Opsiyonel.",
          en: "Shown above the Sözleşmeler ve Formlar page's title. Optional.",
        },
      },
    },
    {
      // Follow-up 25.08: "altına ekleyebileceği grupları seçebilsin" —
      // replaces the old flat `documents` array (which had no real grouping
      // and depended on matching each PDF to a LINE of the `intro` richText
      // by array index — a fragile, invisible coupling). Each group now
      // carries its own label and owns its documents directly, and each
      // document's OWN `label` is what's shown as its button text — no more
      // implicit index-matching against `intro`.
      name: "groups",
      type: "array",
      label: { tr: "Belge Grupları", en: "Document Groups" },
      admin: {
        condition: (data) => data?.slug === "sozlesmeler-ve-formlar",
        description: {
          tr: "Yalnızca Sözleşmeler ve Formlar sayfası için: indirilebilir belgeler, başlıklı gruplar halinde.",
          en: "Only for the Sözleşmeler ve Formlar page: downloadable documents, organized into labeled groups.",
        },
      },
      fields: [
        { name: "label", type: "text", required: true, label: { tr: "Grup Başlığı", en: "Group Label" } },
        {
          name: "documents",
          type: "array",
          label: { tr: "Belgeler", en: "Documents" },
          fields: [
            { name: "label", type: "text", required: true, label: { tr: "Belge Adı", en: "Document Label" } },
            // A PDF uploaded here creates a Documents record via a drawer
            // (Documents.ts is `admin.hidden: true` now — this is the ONLY
            // real entry point for adding one) rather than requiring a trip
            // to a separate collection first.
            { name: "file", type: "upload", relationTo: "documents", required: true },
            {
              // Follow-up 25.08: "disable edebilsin" — same
              // enabled/disabled pattern as Campaigns/Announcements, so a
              // document can be pulled from the live page without deleting
              // the underlying PDF (e.g. an expired contract version).
              name: "enabled",
              type: "checkbox",
              defaultValue: true,
              label: { tr: "Sitede Göster", en: "Show on site" },
            },
          ],
        },
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
