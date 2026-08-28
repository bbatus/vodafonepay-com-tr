import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";
import { assignNextOrder, orderField, rejectIfGroupFull, FOOTER_ORDER_MAX } from "@/hooks/ordering";

const NAV_LINK_FOOTER_SECTION_LIMITS = {
  "footer-kurumsal": FOOTER_ORDER_MAX,
  "footer-yasal": FOOTER_ORDER_MAX,
};

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
    {
      name: "label",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Menüde/footer'da görünecek yazı, örn: 'Vodafone Pay Kart'.",
          en: "Text shown in the menu/footer, e.g.: 'Vodafone Pay Kart'.",
        },
      },
    },
    {
      name: "href",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Tıklanınca gidilecek adres. İç sayfa için başında / olacak şekilde yazın (örn. /vodafone-pay-kart veya, Pages'te oluşturduğunuz bir sayfa için /{o sayfanın slug'ı}); dış bağlantı için https:// ile başlayın (örn. Bilgi Toplum Hizmetleri linki gibi). Bu alan HERHANGİ bir adresi kabul eder — geliştirici sitedeki mevcut sayfaların adres listesini size verebilir.",
          en: "Address to go to when clicked. For an internal page start with / (e.g. /vodafone-pay-kart, or /{that page's slug} for a page you created in Pages); for an external link start with https:// (e.g. the Bilgi Toplum Hizmetleri link). This field accepts ANY address — a developer can give you the list of the site's existing page addresses.",
        },
      },
    },
    {
      // RFP §3.2.2: "editable desktop and mobile URLs" — optional per-link
      // override, only reached by the mobile drawer (HeaderClient.tsx).
      // Empty (the expected case for virtually every link, since the site
      // is one responsive URL, not a separate mobile site) means desktop
      // and mobile keep using the exact same `href` — nothing changes.
      name: "mobileHref",
      type: "text",
      label: { tr: "Mobil URL (opsiyonel)", en: "Mobile URL (optional)" },
      admin: {
        description: {
          tr: "Boş bırakılırsa mobilde de yukarıdaki adres (href) kullanılır. Sadece mobil cihazlarda FARKLI bir adrese göndermek istiyorsanız (örn. bir uygulama deeplink'i) doldurun.",
          en: "If left empty, mobile uses the same address (href) as above. Fill this in only if mobile devices should go somewhere DIFFERENT (e.g. an app deeplink).",
        },
      },
    },
    {
      name: "section",
      type: "select",
      required: true,
      admin: {
        description: {
          tr: `Bu link NEREDE görünecek? Header — Ürünler = üst menüdeki 'Ürünler' açılır listesi. Header — Ana Menü = üst menünün geri kalanı (Kampanyalar, Blog vb.). Footer — Kurumsal/Yasal, footer'daki o iki sütuna karşılık gelir ve her biri en fazla ${FOOTER_ORDER_MAX} link alabilir (footer'ın taşmaması için) — dolu bir sütuna yenisini eklemek isterseniz önce var olan birini silmeniz gerekir. Footer'daki 'Sık Sorulanlar' ve 'Kampanyalar' sütunları artık BURADAN değil, ilgili Sık Sorulanlar/Kampanyalar kaydındaki 'Footer'da Göster' kutusundan yönetiliyor (onlar da aynı ${FOOTER_ORDER_MAX} sınırına tabi). Bir linki KALDIRMAK için bu kaydı silin; SIRASINI değiştirmek için listedeki sürükle-bırak aracını kullanın.`,
          en: `WHERE will this link appear? Header — Ürünler = the 'Ürünler' dropdown in the top menu. Header — Ana Menü = the rest of the top menu (Kampanyalar, Blog, etc.). Footer — Kurumsal/Yasal correspond to those two footer columns, and each one holds at most ${FOOTER_ORDER_MAX} links (so the footer doesn't overflow) — to add another to a full column, delete an existing one first. The footer's 'Sık Sorulanlar' and 'Kampanyalar' columns are no longer managed HERE — use the 'Show in Footer' checkbox on the relevant FAQ/Campaign record instead (same ${FOOTER_ORDER_MAX} limit applies there too). To REMOVE a link, delete this record; to reorder, use the drag-and-drop tool on the list.`,
        },
      },
      options: [
        { label: { tr: "Header — Ürünler", en: "Header — Products" }, value: "header-products" },
        { label: { tr: "Header — Ana Menü", en: "Header — Main Menu" }, value: "header-main" },
        { label: { tr: "Footer — Kurumsal", en: "Footer — Corporate" }, value: "footer-kurumsal" },
        { label: { tr: "Footer — Yasal", en: "Footer — Legal" }, value: "footer-yasal" },
      ],
    },
    orderField({ collection: "nav-links", watchPath: "section", mode: "relationship" }),
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeChange: [
      rejectIfGroupFull({ collection: "nav-links", scopeField: "section", limits: NAV_LINK_FOOTER_SECTION_LIMITS }),
      assignNextOrder("nav-links", ["section"]),
    ],
    afterChange: [revalidateTag("nav-links"), auditAfterChange("nav-links")],
    afterDelete: [revalidateTagOnDelete("nav-links"), auditAfterDelete("nav-links")],
  },
};
