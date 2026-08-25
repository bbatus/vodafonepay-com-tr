import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { turkishSlugify } from "@/lib/slugify";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";

type DocumentRow = { prefix?: string; label?: string; source?: string; slug?: string };
type GroupRow = { documents?: DocumentRow[] };

/**
 * Follow-up 25.08: the "kendin oluştur" documents each get their own page at
 * `/sozlesmeler-ve-formlar/{slug}`, and the editor shouldn't have to invent
 * that slug (same reasoning as Campaigns — see hooks/autoSlug.ts).
 *
 * Uniqueness only has to hold WITHIN this one document, since the site route
 * looks the slug up inside this page's own groups — so this de-duplicates
 * against the other rows in the same save rather than querying the database.
 * An existing slug is never re-derived: the page may already be linked to.
 */
const fillDocumentSlugs: CollectionBeforeValidateHook = ({ data }) => {
  const groups = (data?.groups as GroupRow[] | undefined) ?? [];
  const taken = new Set<string>();

  for (const group of groups) {
    for (const doc of group?.documents ?? []) {
      if (doc?.source !== "page") continue;
      if (typeof doc.slug === "string" && doc.slug.trim()) {
        taken.add(doc.slug);
      }
    }
  }

  for (const group of groups) {
    for (const doc of group?.documents ?? []) {
      if (doc?.source !== "page") continue;
      if (typeof doc.slug === "string" && doc.slug.trim()) continue;
      // Prefer the descriptive prefix for the slug ("tıketici-haklari-..."
      // reads far better than "tiklayiniz" repeated on every row) — fall
      // back to the label alone when there's no prefix to work with.
      const base = turkishSlugify(`${doc.prefix ?? ""} ${doc.label ?? ""}`.trim() || doc.label || "");
      if (!base) continue;
      let candidate = base;
      let suffix = 2;
      while (taken.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
      }
      taken.add(candidate);
      doc.slug = candidate;
    }
  }
  return data;
};

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
            {
              // Follow-up 25.08: "tıklayınız öncesine de metin girebilmem
              // lazım ... grup başlığının altına text girip ... url'i
              // yanına çekmem lazım." Previously the WHOLE line was one
              // field (`label`) and became the entire clickable link — fine
              // for a document literally titled "Tıklayınız", useless for
              // "Tüketici Hakları Bilgi Formu için tıklayınız" (the real
              // site's own phrasing), where only the last word is meant to
              // be clickable. Splitting this into a plain prefix + a
              // separately-clickable label is what lets an editor type that
              // exact sentence and have only "tıklayınız" be the link.
              name: "prefix",
              type: "text",
              label: { tr: "Açıklama Metni", en: "Description Text" },
              admin: {
                description: {
                  tr: "Bağlantıdan ÖNCE görünen, tıklanamayan kısım. Örn: 'Tüketici Hakları Bilgi Formu için '. Boş bırakılabilir — o zaman satır sadece bağlantı metninden oluşur.",
                  en: "The non-clickable part shown BEFORE the link. E.g. 'For the Consumer Rights Information Form, '. Optional — leave empty for a line that's just the link text.",
                },
              },
            },
            {
              name: "label",
              type: "text",
              required: true,
              label: { tr: "Bağlantı Metni", en: "Link Text" },
              admin: {
                description: {
                  tr: "Tıklanabilir kısım. Örn: 'tıklayınız'.",
                  en: "The clickable part. E.g. 'click here'.",
                },
              },
            },
            {
              /**
               * Follow-up 25.08: "PDF yükle veya kendin olustur seklinde …
               * 2 akış sunucaz."
               *
               * The live vodafonepay.com.tr sends every one of these links
               * off to a raw PDF on a completely different host
               * (cms.vodafone.com.tr/static/…). That's fine when a signed PDF
               * really is the artifact, and wrong when the content is just
               * text that would be better as a real, linkable, indexable page
               * on our own domain. So the editor picks per document.
               */
              name: "source",
              type: "radio",
              required: true,
              defaultValue: "pdf",
              label: { tr: "Belge Kaynağı", en: "Document Source" },
              options: [
                { label: { tr: "PDF / Ses Dosyası Yükle", en: "Upload a PDF / Audio File" }, value: "pdf" },
                { label: { tr: "Kendin Oluştur (sayfa)", en: "Write it here (page)" }, value: "page" },
              ],
              admin: {
                layout: "horizontal",
                description: {
                  tr: "PDF / Ses Dosyası Yükle: imzalı/resmî bir belgeyi ya da seslendirilmiş bir kaydı olduğu gibi yükleyin — ör. 'Seslendirilmiş Sözleşme ve Formlar' grubu için bir ses dosyası. Kendin Oluştur: metni buraya yazarsınız, kendi adresimizde (/sozlesmeler-ve-formlar/...) gerçek bir sayfa olarak yayınlanır.",
                  en: "Upload a PDF / Audio File: publish a signed/official document or a voiced recording as-is — e.g. an audio file for the 'Seslendirilmiş Sözleşme ve Formlar' group. Write it here: type the text and it's published as a real page on our own domain (/sozlesmeler-ve-formlar/...).",
                },
              },
            },
            {
              // A PDF/audio file uploaded here creates a Documents record via
              // a drawer (Documents.ts is `admin.hidden: true` now — this is
              // the ONLY real entry point for adding one) rather than
              // requiring a trip to a separate collection first. Stored in
              // MinIO like every other upload, so the link stays on
              // infrastructure we control — never a static file baked into
              // the site's own codebase, and never a raw link straight to
              // MinIO either; see the site's belge/page.tsx viewer route,
              // which is what actually gets linked to.
              name: "file",
              type: "upload",
              relationTo: "documents",
              label: { tr: "PDF / Ses Dosyası", en: "PDF / Audio File" },
              admin: {
                condition: (_data, siblingData) => siblingData?.source !== "page",
                description: {
                  tr: "Yüklenen dosya MinIO'da saklanır. Sitede tıklandığında, dosyayı kendi ayrı görüntüleyici sayfamızda açar (PDF için gömülü görüntüleyici, ses dosyası için oynatıcı) — kullanıcı doğrudan bir MinIO adresine gitmez.",
                  en: "The uploaded file is stored in MinIO. On the site, clicking it opens our own dedicated viewer page (an embedded viewer for PDFs, a player for audio) — the user never lands on a raw MinIO address.",
                },
              },
              // `required: true` can't be used with a `condition`: Payload
              // still validates a hidden field, so switching to "page" would
              // block the save on a file that isn't supposed to exist.
              validate: (value: unknown, { siblingData }: { siblingData?: { source?: string } }) => {
                if (siblingData?.source === "page") return true;
                return value ? true : "PDF / Ses Dosyası Yükle seçiliyken bir dosya seçmelisiniz.";
              },
            },
            {
              // Auto-derived from `label` (see fillDocumentSlugs below) — the
              // editor never types it, same reasoning as Campaigns' slug.
              name: "slug",
              type: "text",
              label: { tr: "Sayfa Adresi", en: "Page Address" },
              admin: {
                condition: (_data, siblingData) => siblingData?.source === "page",
                readOnly: true,
                description: {
                  tr: "Belge adından otomatik oluşur. Sayfa şu adreste yayınlanır: /sozlesmeler-ve-formlar/{adres}",
                  en: "Generated automatically from the document label. The page is published at /sozlesmeler-ve-formlar/{address}",
                },
              },
            },
            {
              name: "body",
              type: "richText",
              label: { tr: "Sayfa İçeriği", en: "Page Content" },
              admin: {
                condition: (_data, siblingData) => siblingData?.source === "page",
                description: {
                  tr: "Sözleşme/form metnini buraya yazın. Başlık, liste, tablo ve bağlantı kullanabilirsiniz.",
                  en: "Write the contract/form text here. Headings, lists, tables and links are available.",
                },
              },
              validate: (value: unknown, { siblingData }: { siblingData?: { source?: string } }) => {
                if (siblingData?.source !== "page") return true;
                return value ? true : "Kendin Oluştur seçiliyken sayfa içeriği boş olamaz.";
              },
            },
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
    beforeValidate: [fillDocumentSlugs],
    afterChange: [revalidateTag("legal-pages"), auditAfterChange("legal-pages")],
    afterDelete: [revalidateTagOnDelete("legal-pages"), auditAfterDelete("legal-pages")],
  },
};
