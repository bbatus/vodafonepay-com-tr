import type { GlobalConfig } from "payload";
import { revalidateGlobalTag } from "@/hooks/revalidate";
import { auditGlobalAfterChange } from "@/hooks/audit";
import { newVerticalReadWrite } from "@/access/roles";

export const ContactInfo: GlobalConfig = {
  slug: "contact-info",
  // Follow-up 25.08: "contact info'nun türkçesi yok sanırım" — correct, this
  // global had no `label` at all, so Payload fell back to printing the raw
  // slug ("Contact Info") in the sidebar regardless of admin language. It's a
  // global, not a collection, so it isn't covered by the `collectionLabel.*`
  // rows in the Translations collection either.
  label: { tr: "İletişim Bilgileri", en: "Contact Info" },
  admin: {
    hideAPIURL: true,
    group: { tr: "Site Yapısı", en: "Site Structure" },
    description: {
      tr: "Sitenin her sayfasındaki footer'da ve İletişim / Kurumsal Yönetim sayfalarında gösterilen resmî şirket ve başvuru bilgileri. Tek kayıttır — burada yapılan değişiklik sitenin tamamını etkiler.",
      en: "The official company and complaint-channel details shown in the footer on every page and on the Contact / Corporate Governance pages. Single record — a change here affects the whole site.",
    },
    components: {
      elements: {
        beforeDocumentControls: [{ path: "/components/HelpButton#default", clientProps: { collection: "contact-info" } }],
      },
    },
  },
  access: {
    read: () => true,
    update: newVerticalReadWrite,
  },
  // Follow-up 25.08: "her fieldın açıklamasını yazalım" — every other
  // collection tells the editor what a field is for; this global was the one
  // screen that just listed bare English field names with no explanation of
  // what changing them would do or where the value shows up.
  fields: [
    {
      name: "companyName",
      type: "text",
      required: true,
      label: { tr: "Şirket Unvanı", en: "Company Name" },
      admin: {
        description: {
          tr: "Şirketin resmî ticaret unvanı — footer'daki künye bloğunun ilk satırında ve hukuki sayfalarda görünür. Örn: Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş.",
          en: "The company's official registered name — shown on the first line of the footer's legal block and on legal pages.",
        },
      },
    },
    {
      name: "tradeRegistryNo",
      type: "text",
      required: true,
      label: { tr: "Ticaret Sicil Numarası", en: "Trade Registry No" },
      admin: {
        description: {
          tr: "Ticaret sicil kayıt numarası. Yasal olarak sitede gösterilmesi zorunludur — footer künyesinde yer alır.",
          en: "Trade registry number. Legally required to appear on the site — shown in the footer's legal block.",
        },
      },
    },
    {
      name: "address",
      type: "textarea",
      required: true,
      label: { tr: "Şirket Adresi", en: "Company Address" },
      admin: {
        description: {
          tr: "Şirketin merkez adresi. Footer künyesinde ve İletişim sayfasında olduğu gibi gösterilir — satır sonları korunur.",
          en: "The company's registered address. Shown verbatim in the footer and on the Contact page — line breaks are preserved.",
        },
      },
    },
    {
      name: "phone",
      type: "text",
      required: true,
      label: { tr: "Müşteri Hizmetleri Telefonu", en: "Customer Service Phone" },
      admin: {
        description: {
          tr: "Müşterilerin arayacağı numara. İletişim sayfasında tıklanabilir bir telefon bağlantısı olarak gösterilir.",
          en: "The number customers call. Rendered as a click-to-call link on the Contact page.",
        },
      },
    },
    {
      name: "kepAddress",
      type: "text",
      required: true,
      label: { tr: "KEP Adresi", en: "Registered E-mail (KEP)" },
      admin: {
        description: {
          tr: "Kayıtlı Elektronik Posta adresi — resmî/hukuki yazışmaların gönderileceği adres. Normal e-postadan farklıdır ve yasal olarak yayımlanması gerekir.",
          en: "Registered Electronic Mail address used for official/legal correspondence. Different from a normal email address, and legally required to be published.",
        },
      },
    },
    {
      name: "customerServiceText",
      type: "textarea",
      required: true,
      label: { tr: "Müşteri Şikâyet Süreci Metni", en: "Complaint Process Text" },
      admin: {
        description: {
          tr: "Bir müşteri şikâyetini nasıl iletebileceğini ve ne kadar sürede yanıt alacağını anlatan açıklama. İletişim / Kurumsal Yönetim sayfasında olduğu gibi gösterilir.",
          en: "Explains how a customer can file a complaint and how quickly they'll get a reply. Shown verbatim on the Contact / Corporate Governance page.",
        },
      },
    },
    {
      name: "tcmbAddress",
      type: "textarea",
      required: true,
      label: { tr: "TCMB Adresi", en: "Central Bank Address" },
      admin: {
        description: {
          tr: "Türkiye Cumhuriyet Merkez Bankası'nın adresi — müşteri şikâyetini şirkete ilettikten sonra sonuç alamazsa başvurabileceği resmî merci. Yasal zorunluluktur.",
          en: "Address of the Central Bank of Türkiye — the official body a customer escalates to if the company doesn't resolve their complaint. Legally required.",
        },
      },
    },
    {
      name: "tcmbPhone",
      type: "text",
      required: true,
      label: { tr: "TCMB Telefonu", en: "Central Bank Phone" },
      admin: {
        description: {
          tr: "TCMB'ye başvuru için telefon numarası — yukarıdaki TCMB adresiyle aynı blokta gösterilir.",
          en: "Phone number for escalating to the Central Bank — shown in the same block as the address above.",
        },
      },
    },
    {
      name: "tcmbFax",
      type: "text",
      required: true,
      label: { tr: "TCMB Faks", en: "Central Bank Fax" },
      admin: {
        description: {
          tr: "TCMB faks numarası. Bugün az kullanılsa da resmî başvuru kanalı olarak yayımlanması gerekir.",
          en: "Central Bank fax number. Rarely used today, but still has to be published as an official channel.",
        },
      },
    },
    {
      name: "tcmbKep",
      type: "text",
      required: true,
      label: { tr: "TCMB KEP Adresi", en: "Central Bank KEP" },
      admin: {
        description: {
          tr: "TCMB'nin Kayıtlı Elektronik Posta adresi — resmî başvuruların elektronik olarak iletileceği adres.",
          en: "The Central Bank's registered electronic mail address, for filing an official escalation electronically.",
        },
      },
    },
    {
      name: "pressRelationsUrl",
      type: "text",
      label: { tr: "Basın İlişkileri Bağlantısı", en: "Press Relations Link" },
      admin: {
        description: {
          tr: "Opsiyonel — Vodafone'un basın/medya sayfasının adresi. Doldurulursa İletişim sayfasında 'Basın İlişkileri' bağlantısı görünür, boş bırakılırsa o bağlantı hiç gösterilmez.",
          en: "Optional — URL of Vodafone's press/media page. Fill it in and a 'Press Relations' link appears on the Contact page; leave it empty and the link isn't shown at all.",
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobalTag("contact-info"), auditGlobalAfterChange("contact-info")],
  },
};
