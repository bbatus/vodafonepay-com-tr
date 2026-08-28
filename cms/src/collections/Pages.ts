import { APIError } from "payload";
import type {
  Access,
  Block,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest,
  Where,
} from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { sitePreviewUrl } from "@/lib/preview";
import { assignNextFlaggedOrder } from "@/hooks/ordering";
import { dbLabel } from "@/lib/collectionLabels";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";
import { CATEGORY_SCOPES, type CategoryScope } from "@/collections/Categories";
import { seoKeywordsField } from "@/lib/seoFields";

/**
 * RFP §3.3 (Lifecycle Management) / §3.2.13 (drag-and-drop web page design):
 * the biggest gap in the earlier PoC — every page was a hand-written
 * src/app/*\/page.tsx, so a new campaign landing page meant a jira ticket +
 * a developer + a deploy, exactly the flow the RFP's Scope section says the
 * CMS is supposed to remove. This collection lets a non-technical editor
 * compose a NEW page from reusable blocks entirely from the admin UI —
 * Payload's `blocks` field type is natively add/remove/drag-to-reorder in
 * the admin, so no custom drag-and-drop UI needed to satisfy that part.
 *
 * This is deliberately NOT a replacement for the 20 existing hand-built
 * pages (aninda-bakiye, kampanyalar, etc.) — those stay as they are. Pages
 * is for NET NEW pages an editor creates going forward (promo landing
 * pages, campaign hubs) without needing a developer.
 */

/**
 * Butterfly-parity gap-fill (docs/RFP-OPEN-ITEMS.md §9, §13): editors asked
 * for "hangi layout hangi durumda eklenir" guidance. Two things were tried
 * and abandoned before this:
 *
 * 1. A Payload `Block`'s top-level `admin` object has no `description` slot
 *    (only individual FIELDS do — verified via `tsc`), so there's nowhere
 *    to put a paragraph of guidance that Payload renders IN the "+ Add
 *    Block" picker itself.
 * 2. Cramming the explanation into `labels.singular` (tried first) put it
 *    in the one place Payload does render per-block — but live testing
 *    (a real screenshot from the editor) showed the picker's cards are only
 *    ~150px wide and truncate the label with "…" right where the
 *    explanation started. A truncated "Hero (Başlık + Görsel) — sayfanı…"
 *    is worse than no explanation, not better.
 *
 * What actually works: labels are short names ONLY (so they display in
 * full), each block gets a real `admin.images.thumbnail` (a small inline
 * SVG diagram of its layout via `blockThumb` below — Payload's own picker
 * renders these at a 3:2 ratio, so a picture of "3 cards in a row" reads
 * instantly to a non-technical editor in a way text never did), and the
 * actual "when to use this" prose now lives in the Pages help content
 * (`?` button, top of the list/create view — see helpContent.ts's `pages`
 * entry) as one single, comprehensive, actually-readable walkthrough,
 * rather than fragments scattered across 10 truncated card labels.
 *
 * Follow-up 25.08: "vodafone görseli olsa... başlıklarda da atıyorum
 * Vodafone'lu Ol! gibi örnekler olsa". The first pass's thumbnails were
 * abstract wireframes (grey boxes/bars) — accurate as a LAYOUT diagram, but
 * an editor can't tell "Hero" and "İkonlu Kartlar" apart at a glance from two
 * grey-box pictures, and neither one looks like Vodafone Pay. Every "this is
 * where an image goes" area now renders the same red→dark-red gradient the
 * real site's own hero/login panels use (see custom.css's `.vf-login-panel`
 * for the source gradient), and every heading/CTA renders REAL example copy
 * as actual SVG text instead of a grey bar standing in for text — Payload's
 * picker shows these at real pixel size, so the copy is legible, not
 * decorative filler.
 */
function vfImageFill(id: string): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e60000"/><stop offset="1" stop-color="#7a0000"/></linearGradient>`;
}

function blockThumb(inner: string, defs = ""): { thumbnail: { url: string; alt: string } } {
  const defsBlock = defs ? `<defs>${defs}</defs>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" width="480" height="320">${defsBlock}<rect width="480" height="320" fill="#ffffff"/>${inner}</svg>`;
  return { thumbnail: { url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, alt: "" } };
}

/**
 * A block's `category` is a free-text slug, and typing one that doesn't exist
 * used to save silently — the block then rendered NOTHING on the site, with no
 * clue why. Found live: a page whose FAQ block had category "testtttt" showed
 * an invisible gap where the section should be.
 *
 * Kept as text rather than converted to a relationship because existing block
 * rows already store slugs and the site's own getters filter by slug; this
 * validates the value instead, and names the categories that DO exist so the
 * editor can fix it without leaving the screen.
 */
export function categoryExistsValidate(scope: CategoryScope) {
  return async (value: unknown, { req }: { req?: PayloadRequest }) => {
    if (!value || typeof value !== "string" || !value.trim()) return true;
    if (!req?.payload) return true;
    const { docs, totalDocs } = await req.payload.find({
      collection: "categories",
      where: { scope: { equals: scope } },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    });
    if (docs.some((d) => (d as { slug?: string }).slug === value.trim())) return true;
    const available = docs.map((d) => (d as { slug?: string }).slug).filter(Boolean).join(", ");
    const isEnglish = req.i18n?.language === "en";
    if (totalDocs === 0) {
      return isEnglish
        ? `No category exists in this flow yet — create one in Categories first, or leave this empty to show everything.`
        : `Bu akışta henüz hiç kategori yok — önce Kategoriler'den bir tane oluşturun ya da hepsini göstermek için boş bırakın.`;
    }
    return isEnglish
      ? `"${value}" is not a category in this flow. Available: ${available}. Leave empty to show all.`
      : `"${value}" bu akışta bir kategori değil. Mevcut olanlar: ${available}. Hepsini göstermek için boş bırakın.`;
  };
}

const HeroBlock: Block = {
  slug: "hero",
  labels: {
    singular: { tr: "Hero (Başlık + Görsel)", en: "Hero (Heading + Image)" },
    plural: { tr: "Hero Blokları", en: "Hero Blocks" },
  },
  admin: {
    images: blockThumb(
      `<rect x="20" y="20" width="440" height="150" rx="10" fill="url(#heroGrad)"/><circle cx="380" cy="55" r="26" fill="#ffffff" opacity="0.14"/><rect x="46" y="150" width="180" height="26" rx="4" fill="#ffffff" opacity="0.95"/><text x="52" y="169" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#e60000">Pay</text><text x="240" y="105" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">Vodafone'lu Ol!</text><text x="240" y="132" font-family="Arial, sans-serif" font-size="14" fill="#ffe5e5">Ödemenin akıllı haliyle tanış</text><text x="46" y="216" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#111827">Ödemenin Akıllı Hali</text><text x="46" y="240" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Hemen Vodafone Pay'e geç, alışverişini tek dokunuşla tamamla.</text><rect x="46" y="256" width="130" height="30" rx="6" fill="#e60000"/><text x="60" y="276" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Hemen Başla</text>`,
      vfImageFill("heroGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Sayfanın en üstündeki büyük, kalın başlık. Kısa ve iddialı olsun. Örnek: \"Vodafone'lu Ol, Ödemenin Akıllı Halini Keşfet!\" · \"Faturana Yansıt, Sonra Öde\"",
          en: "The large, bold heading at the top of the page. Keep it short and bold. E.g.: \"Vodafone'lu Ol, Ödemenin Akıllı Halini Keşfet!\" · \"Faturana Yansıt, Sonra Öde\"",
        },
      },
    },
    {
      name: "subheading",
      type: "text",
      admin: {
        description: {
          tr: "Başlığın altındaki destek cümlesi — başlıktaki vaadi somutlaştırır. Örnek: \"Hemen Vodafone Pay'e geç, alışverişini tek dokunuşla tamamla.\" Boş bırakılabilir.",
          en: "The supporting line under the heading — makes the heading's promise concrete. E.g.: \"Hemen Vodafone Pay'e geç, alışverişini tek dokunuşla tamamla.\" Optional.",
        },
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: {
          tr: "Sayfanın en üstünde tam genişlikte görünecek büyük görsel. Vodafone marka görseli kullanın (kırmızı zemin + Pay logosu, ya da uygulama ekran görüntüsü). Önerilen ölçü: 1440x600 piksel.",
          en: "The large full-width image at the top of the page. Use Vodafone brand imagery (red background + Pay logo, or an app screenshot). Recommended size: 1440x600px.",
        },
      },
    },
    {
      name: "ctaLabel",
      type: "text",
      admin: {
        description: {
          tr: "Buton üzerinde yazacak metin. Örnek: \"Hemen Başla\" · \"Detayları Gör\" · \"Uygulamayı İndir\". Boş bırakılırsa buton hiç gösterilmez.",
          en: "Text on the button. E.g.: \"Hemen Başla\" · \"Detayları Gör\" · \"Uygulamayı İndir\". If left empty, no button is shown.",
        },
      },
    },
    {
      name: "ctaUrl",
      type: "text",
      admin: {
        description: {
          tr: "Butona tıklayınca gidilecek adres, örn: /kampanyalar veya https://... . ctaLabel doluysa bu da dolu olmalı.",
          en: "Address to go to when the button is clicked, e.g.: /kampanyalar or https://... . Must be filled if ctaLabel is filled.",
        },
      },
    },
  ],
};

const RichTextBlock: Block = {
  slug: "richText",
  labels: {
    singular: { tr: "Metin Bloğu", en: "Text Block" },
    plural: { tr: "Metin Blokları", en: "Text Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="40" y="60" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#111827">Vodafone Pay Nedir?</text><rect x="40" y="4" width="36" height="4" rx="2" fill="#e60000"/><text x="40" y="98" font-family="Arial, sans-serif" font-size="13" fill="#4b5563">Vodafone Pay, faturana yansıtma, sanal kart ve anında</text><rect x="40" y="118" width="400" height="10" rx="2" fill="#d1d5db"/><rect x="40" y="140" width="380" height="10" rx="2" fill="#d1d5db"/><rect x="40" y="162" width="400" height="10" rx="2" fill="#d1d5db"/><rect x="40" y="184" width="320" height="10" rx="2" fill="#d1d5db"/><rect x="40" y="212" width="400" height="10" rx="2" fill="#d1d5db"/><rect x="40" y="234" width="260" height="10" rx="2" fill="#d1d5db"/>`
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: {
        description: {
          tr: "Bu metin bölümünün başlığı. Örnek: \"Vodafone Pay Nedir?\" · \"Neden Vodafone Pay?\". Boş bırakılırsa başlıksız sadece metin gösterilir.",
          en: "This text section's heading. E.g.: \"Vodafone Pay Nedir?\" · \"Neden Vodafone Pay?\". If left empty, only the text shows, with no heading.",
        },
      },
    },
    { name: "body", type: "richText", required: true },
  ],
};

const FaqListBlock: Block = {
  slug: "faqList",
  labels: {
    singular: { tr: "SSS Bloğu", en: "FAQ Block" },
    plural: { tr: "SSS Blokları", en: "FAQ Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="40" y="34" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Sıkça Sorulan Sorular</text><rect x="40" y="48" width="400" height="56" rx="6" fill="#f9fafb" stroke="#e5e7eb"/><text x="60" y="82" font-family="Arial, sans-serif" font-size="14" fill="#111827">Vodafone Pay nedir?</text><path d="M410 78 l10 10 l10 -10" stroke="#e60000" stroke-width="4" fill="none"/><rect x="40" y="118" width="400" height="56" rx="6" fill="#f9fafb" stroke="#e5e7eb"/><text x="60" y="152" font-family="Arial, sans-serif" font-size="14" fill="#111827">Nasıl kart alırım?</text><path d="M410 148 l10 10 l10 -10" stroke="#e60000" stroke-width="4" fill="none"/><rect x="40" y="188" width="400" height="56" rx="6" fill="#f9fafb" stroke="#e5e7eb"/><text x="60" y="222" font-family="Arial, sans-serif" font-size="14" fill="#111827">Limitimi nasıl artırırım?</text><path d="M410 218 l10 10 l10 -10" stroke="#e60000" stroke-width="4" fill="none"/>`
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: {
        description: {
          tr: "SSS bölümünün başlığı. Örnek: \"Vodafone Pay Hakkında Merak Edilenler\". Boş bırakılabilir.",
          en: "The FAQ section's heading. E.g.: \"Vodafone Pay Hakkında Merak Edilenler\". Optional.",
        },
      },
    },
    {
      name: "category",
      type: "text",
      validate: categoryExistsValidate(CATEGORY_SCOPES.FAQ),
      admin: {
        description: {
          tr: "Sadece BELİRLİ bir kategorideki soruları göstermek için Kategoriler koleksiyonundaki (Akış: Sık Sorulanlar) o kategorinin slug'ını yazın, örn: kampanyalar. Boş bırakılırsa SSS akışındaki TÜM sorular gelir.",
          en: "To show questions from only ONE SPECIFIC category, enter that category's slug from the Categories collection (Flow: FAQ), e.g.: kampanyalar. If left empty, ALL questions in the FAQ flow are shown.",
        },
      },
    },
    {
      name: "categoryHint",
      type: "ui",
      admin: { components: { Field: { path: "/components/CategorySlugHint#default", clientProps: { scope: "faq" } } } },
    },
  ],
};

const CampaignGridBlock: Block = {
  slug: "campaignGrid",
  labels: {
    singular: { tr: "Kampanya Grid Bloğu", en: "Campaign Grid Block" },
    plural: { tr: "Kampanya Grid Blokları", en: "Campaign Grid Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="40" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Bu Ayın Kampanyaları</text><rect x="40" y="44" width="130" height="80" rx="8" fill="url(#cgGrad)"/><text x="52" y="90" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Yaz</text><text x="52" y="108" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Kampanyası</text><rect x="40" y="132" width="100" height="9" rx="2" fill="#111827"/><rect x="190" y="44" width="130" height="80" rx="8" fill="url(#cgGrad)"/><text x="202" y="90" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Öğrenci</text><text x="202" y="108" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Fırsatı</text><rect x="190" y="132" width="100" height="9" rx="2" fill="#111827"/><rect x="340" y="44" width="130" height="80" rx="8" fill="url(#cgGrad)"/><text x="352" y="90" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Fatura</text><text x="352" y="108" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Kampanyası</text><rect x="340" y="132" width="100" height="9" rx="2" fill="#111827"/>`,
      vfImageFill("cgGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Vitrinin başlığı. Örnek: \"Vodafone'lulara Özel Kampanyalar\" · \"Bu Ayın Fırsatları\".",
          en: "The showcase's heading. E.g.: \"Vodafone'lulara Özel Kampanyalar\" · \"Bu Ayın Fırsatları\".",
        },
      },
    },
    {
      name: "category",
      type: "text",
      validate: categoryExistsValidate(CATEGORY_SCOPES.CAMPAIGN),
      admin: {
        description: {
          tr: "Sadece BELİRLİ bir kategorideki kampanyaları göstermek için Kategoriler koleksiyonundaki (Akış: Kampanyalar) o kategorinin slug'ını yazın, örn: kart. Boş bırakılırsa TÜM aktif kampanyalar gelir.",
          en: "To show campaigns from only ONE SPECIFIC category, enter that category's slug from the Categories collection (Flow: Campaigns), e.g.: kart. If left empty, ALL active campaigns are shown.",
        },
      },
    },
    {
      name: "categoryHint",
      type: "ui",
      admin: { components: { Field: { path: "/components/CategorySlugHint#default", clientProps: { scope: "campaign" } } } },
    },
  ],
};

const VideoBlock: Block = {
  slug: "video",
  labels: {
    singular: { tr: "Video Bloğu", en: "Video Block" },
    plural: { tr: "Video Blokları", en: "Video Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="60" y="28" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Vodafone Pay Nasıl Kullanılır?</text><rect x="60" y="40" width="360" height="210" rx="8" fill="url(#vidGrad)"/><circle cx="240" cy="145" r="34" fill="#ffffff" opacity="0.92"/><path d="M228 126 L228 164 L260 145 Z" fill="#e60000"/><text x="240" y="220" font-family="Arial, sans-serif" font-size="12" fill="#ffe5e5" text-anchor="middle">60 saniyede özet</text>`,
      vfImageFill("vidGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: {
        description: {
          tr: "Videonun üstünde gösterilecek başlık. Örnek: \"Vodafone Pay Nasıl Kullanılır?\" · \"60 Saniyede Faturana Yansıt\". Boş bırakılabilir.",
          en: "The heading shown above the video. E.g.: \"Vodafone Pay Nasıl Kullanılır?\" · \"60 Saniyede Faturana Yansıt\". Optional.",
        },
      },
    },
    {
      name: "youtubeId",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Sadece video ID'si — tam URL değil. https://www.youtube.com/watch?v=ABC123XYZ adresindeki ABC123XYZ kısmını yazın.",
          en: "Just the video ID — not the full URL. Enter the ABC123XYZ part of https://www.youtube.com/watch?v=ABC123XYZ.",
        },
      },
    },
  ],
};

const LogoGridBlock: Block = {
  slug: "logoGrid",
  labels: {
    singular: { tr: "Logo Grid Bloğu", en: "Logo Grid Block" },
    plural: { tr: "Logo Grid Blokları", en: "Logo Grid Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="40" y="60" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Anlaşmalı Bankalar</text><rect x="40" y="130" width="64" height="60" rx="4" fill="#f9fafb" stroke="#e5e7eb"/><text x="72" y="164" font-family="Arial, sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">LOGO</text><rect x="124" y="130" width="64" height="60" rx="4" fill="#f9fafb" stroke="#e5e7eb"/><text x="156" y="164" font-family="Arial, sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">LOGO</text><rect x="208" y="130" width="64" height="60" rx="4" fill="#f9fafb" stroke="#e5e7eb"/><text x="240" y="164" font-family="Arial, sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">LOGO</text><rect x="292" y="130" width="64" height="60" rx="4" fill="#f9fafb" stroke="#e5e7eb"/><text x="324" y="164" font-family="Arial, sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">LOGO</text><rect x="376" y="130" width="64" height="60" rx="4" fill="#f9fafb" stroke="#e5e7eb"/><text x="408" y="164" font-family="Arial, sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">LOGO</text>`
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: {
        description: {
          tr: "Vitrinin başlığı. Örnek: \"Anlaşmalı Bankalar\" · \"Vodafone Pay'i Kullanabileceğiniz Yerler\". Boş bırakılabilir.",
          en: "The showcase's heading. E.g.: \"Anlaşmalı Bankalar\" · \"Vodafone Pay'i Kullanabileceğiniz Yerler\". Optional.",
        },
      },
    },
    {
      name: "logos",
      type: "array",
      minRows: 1,
      admin: {
        description: {
          tr: "Her satır bir logo. '+ Logo Ekle' ile yenisini ekleyin, sürükleyerek sırasını değiştirin.",
          en: "Each row is one logo. Use '+ Add Logo' to add a new one, drag to reorder.",
        },
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          admin: {
            description: {
              tr: "Logonun adı (ekranda görünmez, erişilebilirlik/alt-text için).",
              en: "The logo's name (not shown on screen, used for accessibility/alt text).",
            },
          },
        },
        { name: "logo", type: "upload", relationTo: "media", required: true, admin: { description: { tr: "Logo görseli.", en: "The logo image." } } },
        {
          name: "linkUrl",
          type: "text",
          admin: {
            description: {
              tr: "Logoya tıklayınca gidilecek adres. Boş bırakılırsa logo tıklanamaz olur.",
              en: "Address to go to when the logo is clicked. If left empty, the logo isn't clickable.",
            },
          },
        },
      ],
    },
  ],
};

/**
 * The following 4 blocks close the gap found while migrating the 5
 * hand-built product pages (aninda-bakiye, faturana-yansit, vodafone-pay-kart,
 * qr-ile-faturana-yansit, vodafone-pay-uygulama) onto Pages — see
 * docs/RFP-OPEN-ITEMS.md §10. Each replaces a component those pages used
 * that had no Pages-block equivalent (CardsWithIcons/HowToEarn,
 * PhoneStepsCarousel, AppFeatures/EarnWithCard, VideoGuideSection). Three
 * OTHER components from those pages (WhereCanIBuy, VideosWithTabs,
 * LeadFormCta) are deliberately NOT blocks — they're either not CMS-driven
 * at all or a real interactive form, not editable content; see that same
 * doc section for why a "content block" can't sensibly represent them.
 */

const IconCardsBlock: Block = {
  slug: "iconCards",
  labels: {
    singular: { tr: "İkonlu Kartlar Bloğu", en: "Icon Cards Block" },
    plural: { tr: "İkonlu Kartlar Blokları", en: "Icon Cards Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="40" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Vodafone Pay Ayrıcalıkları</text><rect x="40" y="44" width="130" height="150" rx="8" fill="#f9fafb" stroke="#e5e7eb"/><circle cx="105" cy="84" r="18" fill="#e60000"/><text x="105" y="90" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">₺</text><text x="55" y="128" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Anında Bakiye</text><rect x="55" y="140" width="100" height="8" rx="2" fill="#d1d5db"/><rect x="55" y="155" width="70" height="8" rx="2" fill="#d1d5db"/><rect x="190" y="44" width="130" height="150" rx="8" fill="#f9fafb" stroke="#e5e7eb"/><circle cx="255" cy="84" r="18" fill="#e60000"/><text x="255" y="90" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">%</text><text x="205" y="128" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Faturana Yansıt</text><rect x="205" y="140" width="100" height="8" rx="2" fill="#d1d5db"/><rect x="205" y="155" width="70" height="8" rx="2" fill="#d1d5db"/><rect x="340" y="44" width="130" height="150" rx="8" fill="#f9fafb" stroke="#e5e7eb"/><circle cx="405" cy="84" r="18" fill="#e60000"/><text x="405" y="90" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" text-anchor="middle">))</text><text x="355" y="128" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Temassız Öde</text><rect x="355" y="140" width="100" height="8" rx="2" fill="#d1d5db"/><rect x="355" y="155" width="70" height="8" rx="2" fill="#d1d5db"/>`
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: {
        description: {
          tr: "Bölümün başlığı. Örnek: \"Vodafone Pay Ayrıcalıkları\" · \"Akıllı Ödeme Yöntemleri\". Boş bırakılabilir.",
          en: "The section's heading. E.g.: \"Vodafone Pay Ayrıcalıkları\" · \"Akıllı Ödeme Yöntemleri\". Optional.",
        },
      },
    },
    {
      // Migration follow-up (28.08): CardsWithIcons.tsx already accepts an
      // optional `description` subheading under the heading — used by the
      // hand-written /faturana-yansit page but never exposed here, so an
      // editor recreating that page from the block had nowhere to put it.
      name: "description",
      type: "textarea",
      admin: {
        description: {
          tr: "Başlığın altındaki açıklama paragrafı. Boş bırakılabilir.",
          en: "The paragraph under the heading. Optional.",
        },
      },
    },
    {
      name: "cards",
      type: "array",
      minRows: 1,
      admin: {
        description: {
          tr: "Her satır bir kart (ikon + başlık + kısa açıklama). '+ Kart Ekle' ile yenisini ekleyin, sürükleyerek sırasını değiştirin. Genelde 3 kart kullanılır.",
          en: "Each row is one card (icon + title + short text). Use '+ Add Card' to add a new one, drag to reorder. Usually 3 cards are used.",
        },
      },
      fields: [
        {
          name: "icon",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: {
            description: {
              tr: "Küçük ikon görseli — Vodafone ikon setinden, tercihen tek renk (kırmızı ya da koyu gri), 64x64 piksel.",
              en: "A small icon image — from the Vodafone icon set, preferably a single color (red or dark grey), 64x64px.",
            },
          },
        },
        {
          name: "title",
          type: "text",
          required: true,
          admin: {
            description: {
              tr: "Kartın başlığı — 2-4 kelime. Örnek: \"Size Özel Limit\" · \"Anında Bakiye\" · \"Temassız Öde\".",
              en: "The card's title — 2-4 words. E.g.: \"Size Özel Limit\" · \"Anında Bakiye\" · \"Temassız Öde\".",
            },
          },
        },
        {
          name: "text",
          type: "textarea",
          required: true,
          admin: {
            description: {
              tr: "Kartın kısa açıklama metni, 1-2 cümle. Örnek: \"Faturana yansıt, ay sonunda tek seferde öde. Ekstra ücret yok.\"",
              en: "The card's short text, 1-2 sentences. E.g.: \"Faturana yansıt, ay sonunda tek seferde öde. Ekstra ücret yok.\"",
            },
          },
        },
      ],
    },
  ],
};

const StepsBlock: Block = {
  slug: "steps",
  labels: {
    singular: { tr: "Adım Listesi Bloğu", en: "Steps Block" },
    plural: { tr: "Adım Listesi Blokları", en: "Steps Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="40" y="28" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">3 Adımda Vodafone Pay</text><circle cx="70" cy="72" r="18" fill="#e60000"/><text x="70" y="77" font-size="14" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700">01</text><rect x="115" y="52" width="60" height="40" rx="4" fill="url(#stepGrad)"/><text x="190" y="68" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111827">Uygulamayı indir</text><rect x="190" y="78" width="200" height="8" rx="2" fill="#d1d5db"/><circle cx="70" cy="157" r="18" fill="#e60000"/><text x="70" y="162" font-size="14" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700">02</text><rect x="115" y="137" width="60" height="40" rx="4" fill="url(#stepGrad)"/><text x="190" y="153" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111827">Kart başvurusu yap</text><rect x="190" y="163" width="200" height="8" rx="2" fill="#d1d5db"/><circle cx="70" cy="242" r="18" fill="#e60000"/><text x="70" y="247" font-size="14" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700">03</text><rect x="115" y="222" width="60" height="40" rx="4" fill="url(#stepGrad)"/><text x="190" y="238" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111827">Hemen ödemeye başla</text><rect x="190" y="248" width="200" height="8" rx="2" fill="#d1d5db"/>`,
      vfImageFill("stepGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: {
        description: {
          tr: "Bölümün başlığı. Örnek: \"3 Adımda Vodafone Pay\" · \"Nasıl Kullanırım?\". Boş bırakılabilir.",
          en: "The section's heading. E.g.: \"3 Adımda Vodafone Pay\" · \"Nasıl Kullanırım?\". Optional.",
        },
      },
    },
    {
      name: "steps",
      type: "array",
      minRows: 1,
      admin: {
        description: {
          tr: "Her satır bir adım (sıra numarası + açıklama + o adımı gösteren görsel). '+ Adım Ekle' ile yenisini ekleyin, sürükleyerek sırasını değiştirin.",
          en: "Each row is one step (number + text + an image showing that step). Use '+ Add Step' to add a new one, drag to reorder.",
        },
      },
      fields: [
        {
          name: "number",
          type: "text",
          required: true,
          admin: { description: { tr: "Adım numarası, örn: '01', '02'.", en: "The step number, e.g.: '01', '02'." } },
        },
        {
          name: "text",
          type: "textarea",
          required: true,
          admin: { description: { tr: "Bu adımda kullanıcının ne yapacağını anlatan metin.", en: "Text describing what the user does at this step." } },
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: { description: { tr: "Bu adımı gösteren ekran görüntüsü/görsel.", en: "A screenshot/image showing this step." } },
        },
      ],
    },
  ],
};

/**
 * Live parity gap found by auditing vodafonepay.com.tr's own widget names:
 * `widget_VpayApp_NasilKazanirim` runs on /vodafone-pay-uygulama and
 * /faturana-yansit — a product shot on one side with an icon + connector-line
 * list of steps on the other — and the CMS had no block that could produce it,
 * so an editor could not rebuild those pages from the block library.
 * `HowToEarn.tsx` already renders exactly that layout for the hand-written
 * pages (same `lg:ml-[165px]` offset, same order swap, same 72px icons); this
 * block is what finally exposes it to the page builder.
 */
const HowToEarnBlock: Block = {
  slug: "howToEarn",
  labels: {
    singular: { tr: "Görsel + Adımlı Anlatım Bloğu", en: "Image + Step Story Block" },
    plural: { tr: "Görsel + Adımlı Anlatım Blokları", en: "Image + Step Story Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="30" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Vodafone Pay ile Nasıl Kazanırım?</text><circle cx="52" cy="80" r="20" fill="#e60000"/><text x="90" y="76" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111827">Bakiye Yükle</text><rect x="90" y="86" width="150" height="7" rx="2" fill="#d1d5db"/><line x1="52" y1="100" x2="52" y2="140" stroke="#d1d5db" stroke-width="2"/><circle cx="52" cy="160" r="20" fill="#e60000"/><text x="90" y="156" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111827">Harca</text><rect x="90" y="166" width="150" height="7" rx="2" fill="#d1d5db"/><line x1="52" y1="180" x2="52" y2="220" stroke="#d1d5db" stroke-width="2"/><circle cx="52" cy="240" r="20" fill="#e60000"/><text x="90" y="236" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111827">Kazan</text><rect x="90" y="246" width="150" height="7" rx="2" fill="#d1d5db"/><rect x="320" y="60" width="140" height="200" rx="14" fill="url(#earnGrad)"/>`,
      vfImageFill("earnGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Bölümün başlığı. Örnek: \"Vodafone Pay ile Nasıl Kazanırım?\".",
          en: "The section's heading. E.g.: \"Vodafone Pay ile Nasıl Kazanırım?\".",
        },
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: {
          tr: "Sağda (mobilde üstte) görünecek büyük ürün görseli — genelde bir telefon ekran görüntüsü. Önerilen genişlik: 350 piksel.",
          en: "The large product image shown on the right (on top on mobile) — usually a phone screenshot. Recommended width: 350px.",
        },
      },
    },
    {
      name: "steps",
      type: "array",
      minRows: 1,
      admin: {
        description: {
          tr: "Görselin yanında alt alta sıralanan adımlar (ikon + başlık + açıklama), aralarında bağlayıcı çizgiyle. Genelde 3 adım kullanılır.",
          en: "The steps listed beside the image (icon + title + description), joined by a connector line. Usually 3 steps.",
        },
      },
      fields: [
        {
          name: "icon",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: { description: { tr: "Adımın ikonu (72x72 piksel önerilir).", en: "The step's icon (72x72px recommended)." } },
        },
        {
          name: "title",
          type: "text",
          required: true,
          admin: { description: { tr: "Adımın başlığı, örn: 'Bakiye Yükle'.", en: "The step's title, e.g.: 'Bakiye Yükle'." } },
        },
        {
          name: "description",
          type: "textarea",
          required: true,
          admin: { description: { tr: "Adımın kısa açıklaması.", en: "A short description of the step." } },
        },
      ],
    },
  ],
};

/**
 * Live parity: `widget_WhereCanIBuy` (/vodafone-pay-kart) and
 * `widget_WhereCanIUse` (/faturana-yansit) are the same shape under two
 * names — one illustration with copy beside it. The block library had no way
 * to express "görsel bir tarafta, yazı diğer tarafta", which is one of the
 * most common section shapes on the live site.
 */
const ImageWithTextBlock: Block = {
  slug: "imageWithText",
  labels: {
    singular: { tr: "Görsel + Yan Metin Bloğu", en: "Image + Side Text Block" },
    plural: { tr: "Görsel + Yan Metin Blokları", en: "Image + Side Text Blocks" },
  },
  admin: {
    images: blockThumb(
      `<rect x="24" y="70" width="200" height="180" rx="8" fill="url(#iwtGrad)"/><text x="250" y="110" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#111827">Nereden satın</text><text x="250" y="136" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#111827">alabilirim?</text><rect x="250" y="156" width="200" height="9" rx="3" fill="#d1d5db"/><rect x="250" y="174" width="190" height="9" rx="3" fill="#d1d5db"/><rect x="250" y="192" width="160" height="9" rx="3" fill="#d1d5db"/>`,
      vfImageFill("iwtGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Görselin yanında görünecek başlık. Örnek: \"Nereden satın alabilirim?\" · \"Nerelerde kullanabilirim?\".",
          en: "The heading shown beside the image. E.g.: \"Nereden satın alabilirim?\" · \"Nerelerde kullanabilirim?\".",
        },
      },
    },
    {
      name: "text",
      type: "textarea",
      required: true,
      admin: {
        description: {
          tr: "Başlığın altındaki açıklama metni — 2-4 cümle.",
          en: "The explanatory copy under the heading — 2-4 sentences.",
        },
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: {
          tr: "Yanda görünecek görsel/illüstrasyon. Önerilen genişlik: 434 piksel.",
          en: "The illustration shown alongside. Recommended width: 434px.",
        },
      },
    },
    {
      name: "imageSide",
      type: "select",
      defaultValue: "left",
      label: { tr: "Görselin Tarafı", en: "Image Side" },
      options: [
        { label: { tr: "Solda (yazı sağda)", en: "Left (text on the right)" }, value: "left" },
        { label: { tr: "Sağda (yazı solda)", en: "Right (text on the left)" }, value: "right" },
      ],
      admin: {
        description: {
          tr: "Görselin masaüstünde hangi tarafta duracağı. Mobilde görsel her zaman üstte gösterilir.",
          en: "Which side the image sits on for desktop. On mobile the image is always shown first.",
        },
      },
    },
  ],
};

/**
 * Live parity: `widget_PricesAndLimits` (/ucretler-ve-limitler). Takes no
 * content fields on purpose — the numbers already live in the Fee Rows and
 * Limit Tables collections, and duplicating them into a block would create a
 * second copy an editor has to keep in sync. Same pattern as `faqList` and
 * `campaignGrid`, which also render a collection rather than their own data.
 */
const PricesAndLimitsBlock: Block = {
  slug: "pricesAndLimits",
  labels: {
    singular: { tr: "Ücretler ve Limitler Bloğu", en: "Fees and Limits Block" },
    plural: { tr: "Ücretler ve Limitler Blokları", en: "Fees and Limits Blocks" },
  },
  admin: {
    images: blockThumb(
      `<rect x="30" y="30" width="150" height="34" rx="8" fill="#f2f2f2"/><rect x="34" y="34" width="70" height="26" rx="6" fill="#ffffff"/><text x="46" y="52" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Ücretler</text><text x="118" y="52" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Limitler</text><rect x="30" y="82" width="420" height="30" fill="#f2f2f2"/><text x="42" y="102" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Faturana Yansıt Hizmet Bedeli</text><text x="330" y="102" font-family="Arial, sans-serif" font-size="12" fill="#111827">31,90 TL</text><rect x="30" y="112" width="420" height="30" fill="#fafafa"/><text x="42" y="132" font-family="Arial, sans-serif" font-size="12" fill="#111827">Anında Bakiye İşlem Ücreti</text><text x="330" y="132" font-family="Arial, sans-serif" font-size="12" fill="#111827">%10</text><rect x="30" y="142" width="420" height="30" fill="#ffffff"/><text x="42" y="162" font-family="Arial, sans-serif" font-size="12" fill="#111827">Fatura Ödeme</text><text x="330" y="162" font-family="Arial, sans-serif" font-size="12" fill="#111827">Ücretsiz</text><rect x="30" y="172" width="420" height="30" fill="#fafafa"/><text x="42" y="192" font-family="Arial, sans-serif" font-size="12" fill="#111827">ATM Bakiye Sorgulama</text><text x="330" y="192" font-family="Arial, sans-serif" font-size="12" fill="#111827">Ücretsiz</text>`
    ),
  },
  fields: [
    {
      name: "note",
      type: "ui",
      admin: {
        components: {
          Field: "/components/CollectionBackedBlockNote#default",
        },
      },
    },
  ],
};

/**
 * Live parity: `widget_Blogs` (/blog). The mirror of `campaignGrid` — same
 * card grid, fed from Blog Posts instead of Campaigns.
 */
const BlogGridBlock: Block = {
  slug: "blogGrid",
  labels: {
    singular: { tr: "Blog Grid Bloğu", en: "Blog Grid Block" },
    plural: { tr: "Blog Grid Blokları", en: "Blog Grid Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="30" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Bloglar</text><rect x="30" y="46" width="130" height="80" rx="6" fill="url(#blogGrad)"/><text x="30" y="146" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Ulaşım Kartı Yükleme</text><rect x="30" y="154" width="110" height="8" rx="2" fill="#d1d5db"/><rect x="180" y="46" width="130" height="80" rx="6" fill="url(#blogGrad)"/><text x="180" y="146" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">QR ile Ödeme</text><rect x="180" y="154" width="110" height="8" rx="2" fill="#d1d5db"/><rect x="330" y="46" width="130" height="80" rx="6" fill="url(#blogGrad)"/><text x="330" y="146" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Anında Bakiye</text><rect x="330" y="154" width="110" height="8" rx="2" fill="#d1d5db"/>`,
      vfImageFill("blogGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Vitrinin başlığı. Örnek: \"Bloglar\" · \"Son Yazılar\".",
          en: "The showcase's heading. E.g.: \"Bloglar\" · \"Son Yazılar\".",
        },
      },
    },
    {
      name: "category",
      type: "text",
      validate: categoryExistsValidate(CATEGORY_SCOPES.BLOG),
      admin: {
        description: {
          tr: "Sadece BELİRLİ bir kategorideki yazıları göstermek için Kategoriler koleksiyonundaki (Akış: Blog) o kategorinin slug'ını yazın, örn: haberler. Boş bırakılırsa TÜM yazılar gelir.",
          en: "To show only ONE category's posts, enter that category's slug from the Categories collection (Flow: Blog), e.g.: haberler. Leave empty for ALL posts.",
        },
      },
    },
    {
      name: "categoryHint",
      type: "ui",
      admin: { components: { Field: { path: "/components/CategorySlugHint#default", clientProps: { scope: "blog" } } } },
    },
  ],
};

/**
 * Live parity: `widget_Homepage_VpayAyricaliklarDunyasi` (homepage) and
 * `widget_VpayApp_VpayAyricalikliDunyasi` (/vodafone-pay-uygulama) — a
 * one-third column of icon + title + copy rows with a large media panel
 * filling the rest.
 */
const FeatureHighlightsBlock: Block = {
  slug: "featureHighlights",
  labels: {
    singular: { tr: "Öne Çıkan Özellikler Bloğu", en: "Feature Highlights Block" },
    plural: { tr: "Öne Çıkan Özellikler Blokları", en: "Feature Highlights Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="30" y="32" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Vodafone Pay'in Ayrıcalıklı Dünyası</text><circle cx="44" cy="76" r="14" fill="#e60000"/><text x="70" y="72" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Akıllı Ödeme Yöntemleri</text><rect x="70" y="82" width="150" height="7" rx="2" fill="#d1d5db"/><circle cx="44" cy="136" r="14" fill="#e60000"/><text x="70" y="132" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Nakit İade</text><rect x="70" y="142" width="150" height="7" rx="2" fill="#d1d5db"/><circle cx="44" cy="196" r="14" fill="#e60000"/><text x="70" y="192" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Güvenli Altyapı</text><rect x="70" y="202" width="150" height="7" rx="2" fill="#d1d5db"/><rect x="255" y="60" width="200" height="160" rx="12" fill="url(#fhGrad)"/>`,
      vfImageFill("fhGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: {
        description: {
          tr: "Bölümün başlığı. Örnek: \"Vodafone Pay'in Ayrıcalıklı Dünyası\". Boş bırakılabilir.",
          en: "The section's heading. E.g.: \"Vodafone Pay'in Ayrıcalıklı Dünyası\". Optional.",
        },
      },
    },
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      admin: {
        description: {
          tr: "Sağdaki büyük görsel (masaüstünde görünür). Boş bırakılırsa sitenin kendi tanıtım videosu gösterilir.",
          en: "The large image on the right (desktop only). Leave empty to show the site's own promo video instead.",
        },
      },
    },
    {
      name: "features",
      type: "array",
      minRows: 1,
      admin: {
        description: {
          tr: "Solda alt alta sıralanan özellikler (ikon + başlık + kısa açıklama). Genelde 3-4 tane kullanılır.",
          en: "The features listed down the left (icon + title + short copy). Usually 3-4 of them.",
        },
      },
      fields: [
        {
          name: "icon",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: { description: { tr: "Özelliğin ikonu (36x36 piksel önerilir).", en: "The feature's icon (36x36px recommended)." } },
        },
        {
          name: "title",
          type: "text",
          required: true,
          admin: { description: { tr: "Özelliğin başlığı, örn: 'Akıllı Ödeme Yöntemleri'.", en: "The feature's title, e.g.: 'Akıllı Ödeme Yöntemleri'." } },
        },
        {
          name: "description",
          type: "textarea",
          required: true,
          admin: { description: { tr: "Özelliğin tek cümlelik açıklaması.", en: "A one-sentence description of the feature." } },
        },
      ],
    },
  ],
};

/**
 * Live parity: `widget_BoardOfDirectors` (/kurumsal-yonetim). Named
 * generically because the shape is "photo + name + role" — it suits any team
 * or management listing, not just the board.
 */
const ProfileGridBlock: Block = {
  slug: "profileGrid",
  labels: {
    singular: { tr: "Kişi Kartları Bloğu", en: "Profile Grid Block" },
    plural: { tr: "Kişi Kartları Blokları", en: "Profile Grid Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="30" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Yönetim Kurulu ve Üst Yönetim</text><rect x="30" y="48" width="130" height="120" rx="8" fill="#f2f2f2"/><rect x="40" y="58" width="110" height="70" rx="6" fill="url(#pgGrad)"/><text x="40" y="146" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Ada Yılmaz</text><text x="40" y="162" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">Genel Müdür</text><rect x="175" y="48" width="130" height="120" rx="8" fill="#f2f2f2"/><rect x="185" y="58" width="110" height="70" rx="6" fill="url(#pgGrad)"/><text x="185" y="146" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Deniz Kaya</text><text x="185" y="162" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">Finans Direktörü</text><rect x="320" y="48" width="130" height="120" rx="8" fill="#f2f2f2"/><rect x="330" y="58" width="110" height="70" rx="6" fill="url(#pgGrad)"/><text x="330" y="146" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Ege Demir</text><text x="330" y="162" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">Teknoloji Direktörü</text>`,
      vfImageFill("pgGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: {
        description: {
          tr: "Bölümün başlığı. Örnek: \"Yönetim Kurulu ve Üst Yönetim\" · \"Ekibimiz\". Boş bırakılabilir.",
          en: "The section's heading. E.g.: \"Yönetim Kurulu ve Üst Yönetim\" · \"Ekibimiz\". Optional.",
        },
      },
    },
    {
      name: "people",
      type: "array",
      minRows: 1,
      admin: {
        description: {
          tr: "Her satır bir kişi (fotoğraf + isim + unvan). Masaüstünde 3'lü, tablette 2'li, mobilde tek sütun dizilir.",
          en: "Each row is one person (photo + name + role). Lays out 3 across on desktop, 2 on tablet, 1 on mobile.",
        },
      },
      fields: [
        {
          name: "photo",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: { description: { tr: "Kişinin fotoğrafı. Önerilen ölçü: 291x200 piksel.", en: "The person's photo. Recommended size: 291x200px." } },
        },
        {
          name: "name",
          type: "text",
          required: true,
          admin: { description: { tr: "Ad soyad.", en: "Full name." } },
        },
        {
          name: "title",
          type: "text",
          required: true,
          admin: { description: { tr: "Unvan, örn: 'Genel Müdür'.", en: "Role, e.g.: 'Genel Müdür'." } },
        },
      ],
    },
  ],
};

/**
 * Live parity: `widget_PhysicalCardUsed` (/vodafone-pay-kart) — art used as
 * the panel BACKGROUND with white copy and an optional video on top. Named
 * generically because the shape suits any product/campaign section, not just
 * the physical card.
 */
const MediaPanelBlock: Block = {
  slug: "mediaPanel",
  labels: {
    singular: { tr: "Görsel Zeminli Panel", en: "Media Panel" },
    plural: { tr: "Görsel Zeminli Paneller", en: "Media Panels" },
  },
  admin: {
    images: blockThumb(
      `<rect x="24" y="40" width="432" height="240" rx="12" fill="url(#mpGrad)"/><text x="56" y="100" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Fiziksel Kart nerelerde kullanılır?</text><rect x="56" y="118" width="240" height="8" rx="2" fill="#ffffff" opacity="0.6"/><rect x="56" y="136" width="200" height="8" rx="2" fill="#ffffff" opacity="0.6"/><rect x="56" y="164" width="180" height="100" rx="6" fill="#000000" opacity="0.55"/><circle cx="146" cy="214" r="20" fill="#ffffff" opacity="0.9"/><path d="M140 204 l18 10 l-18 10 z" fill="#e60000"/>`,
      vfImageFill("mpGrad")
    ),
  },
  fields: [
    { name: "heading", type: "text", required: true,
      admin: { description: { tr: "Panelin üzerindeki beyaz başlık.", en: "The white heading over the panel." } } },
    { name: "text", type: "textarea",
      admin: { description: { tr: "Başlığın altındaki açıklama. Boş bırakılabilir.", en: "Copy under the heading. Optional." } } },
    { name: "backgroundImage", type: "upload", relationTo: "media", required: true,
      admin: { description: { tr: "Panelin arka plan görseli — metin bunun ÜZERİNE beyaz olarak biner, o yüzden koyu bir görsel seçin. Önerilen: 1030x420 piksel.", en: "The panel's background art — the copy sits ON it in white, so pick a dark image. Recommended: 1030x420px." } } },
    { name: "youtubeId", type: "text",
      admin: { description: { tr: "Panelin içinde gösterilecek videonun YouTube ID'si (tam URL değil). Boş bırakılırsa video gösterilmez.", en: "YouTube ID (not the full URL) of a video to embed inside the panel. Leave empty for no video." } } },
  ],
};

/**
 * Live parity: `widget_FooterPages\ContactInfo` (/iletisim). Collection-backed
 * like `pricesAndLimits` — the details live in the ContactInfo global.
 */
const ContactInfoBlock: Block = {
  slug: "contactInfo",
  labels: {
    singular: { tr: "İletişim Bilgileri Bloğu", en: "Contact Info Block" },
    plural: { tr: "İletişim Bilgileri Blokları", en: "Contact Info Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="30" y="34" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">İletişim Bilgileri</text><rect x="30" y="56" width="420" height="200" rx="8" fill="#f2f2f2"/><text x="50" y="92" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Şirket Unvanı</text><text x="250" y="92" font-family="Arial, sans-serif" font-size="13" fill="#333333">Vodafone Elektronik Para A.Ş.</text><text x="50" y="132" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Adres</text><text x="250" y="132" font-family="Arial, sans-serif" font-size="13" fill="#333333">İstanbul</text><text x="50" y="172" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">Telefon</text><text x="250" y="172" font-family="Arial, sans-serif" font-size="13" fill="#333333">0850 250 XX XX</text><text x="50" y="212" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">KEP Adresi</text><text x="250" y="212" font-family="Arial, sans-serif" font-size="13" fill="#333333">vodafone@hs01.kep.tr</text>`
    ),
  },
  fields: [
    { name: "heading", type: "text",
      admin: { description: { tr: "Bölümün başlığı, örn: 'İletişim Bilgileri'. Boş bırakılabilir.", en: "The section heading, e.g. 'İletişim Bilgileri'. Optional." } } },
    { name: "note", type: "ui", admin: { components: { Field: "/components/CollectionBackedBlockNote#default" } } },
  ],
};

/**
 * Live parity: `widget_Representatives` (/temsilciliklerimiz) — the directory
 * listing only. The province/district search form stays on its own page; it is
 * a whole page's worth of UI, not a section to drop mid-page.
 */
const RepresentativesBlock: Block = {
  slug: "representatives",
  labels: {
    singular: { tr: "Temsilci Listesi Bloğu", en: "Representative List Block" },
    plural: { tr: "Temsilci Listesi Blokları", en: "Representative List Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="30" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Temsilciliklerimiz</text><rect x="30" y="48" width="130" height="110" rx="8" fill="#f2f2f2"/><text x="42" y="76" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Ada İletişim</text><rect x="42" y="86" width="100" height="7" rx="2" fill="#d1d5db"/><rect x="42" y="100" width="80" height="7" rx="2" fill="#d1d5db"/><rect x="175" y="48" width="130" height="110" rx="8" fill="#f2f2f2"/><text x="187" y="76" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Deniz Telekom</text><rect x="187" y="86" width="100" height="7" rx="2" fill="#d1d5db"/><rect x="187" y="100" width="80" height="7" rx="2" fill="#d1d5db"/><rect x="320" y="48" width="130" height="110" rx="8" fill="#f2f2f2"/><text x="332" y="76" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Ege Mobil</text><rect x="332" y="86" width="100" height="7" rx="2" fill="#d1d5db"/><rect x="332" y="100" width="80" height="7" rx="2" fill="#d1d5db"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text",
      admin: { description: { tr: "Bölümün başlığı, örn: 'Temsilciliklerimiz'. Boş bırakılabilir.", en: "The section heading. Optional." } } },
    { name: "limit", type: "number", min: 1,
      admin: { description: { tr: "En fazla kaç temsilci gösterilsin. Boş bırakılırsa TÜMÜ listelenir — tam liste için /temsilciliklerimiz sayfasını kullanmak genelde daha doğrudur.", en: "How many representatives to show at most. Leave empty for ALL — for the full directory the /temsilciliklerimiz page is usually the better place." } } },
    { name: "note", type: "ui", admin: { components: { Field: "/components/CollectionBackedBlockNote#default" } } },
  ],
};

/**
 * Live parity: `widget_Homepage_VpayStepPhones` — the homepage's alternating
 * phone-screenshot / copy rows. Added so the HOMEPAGE itself can be rebuilt
 * from the block library (its heading and description used to be hardcoded in
 * StepPhones.tsx, which is what blocked that).
 */
const StepPhonesBlock: Block = {
  slug: "stepPhones",
  labels: {
    singular: { tr: "Telefonlu Tanıtım Bloğu", en: "Phone Showcase Block" },
    plural: { tr: "Telefonlu Tanıtım Blokları", en: "Phone Showcase Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="120" y="34" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#111827">Vodafone Pay'de bizi neler bekliyor?</text><rect x="40" y="60" width="90" height="180" rx="12" fill="url(#spGrad)"/><text x="160" y="110" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#111827">Faturana Yansıt</text><rect x="160" y="124" width="220" height="8" rx="2" fill="#d1d5db"/><rect x="160" y="142" width="180" height="8" rx="2" fill="#d1d5db"/><rect x="350" y="250" width="90" height="60" rx="12" fill="url(#spGrad)"/><text x="60" y="282" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#111827">Vodafone Pay Kart</text><rect x="60" y="296" width="220" height="8" rx="2" fill="#d1d5db"/>`,
      vfImageFill("spGrad")
    ),
  },
  fields: [
    { name: "heading", type: "text",
      admin: { description: { tr: "Bölümün ortalı başlığı. Boş bırakılırsa anasayfanın kendi başlığı kullanılır.", en: "The section's centred heading. Leave empty to use the homepage's own." } } },
    { name: "description", type: "textarea",
      admin: { description: { tr: "Başlığın altındaki tanıtım metni. Boş bırakılabilir.", en: "The intro copy under the heading. Optional." } } },
    {
      name: "steps", type: "array", minRows: 1,
      admin: { description: { tr: "Her satır bir ürün tanıtımı (telefon görseli + başlık + açıklama). Satırlar dönüşümlü olarak solda/sağda dizilir.", en: "Each row is one product showcase (phone image + title + copy). Rows alternate left/right." } },
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true,
          admin: { description: { tr: "Telefon ekran görüntüsü. Önerilen genişlik: 560 piksel.", en: "The phone screenshot. Recommended width: 560px." } } },
        { name: "title", type: "text", required: true,
          admin: { description: { tr: "Ürünün adı, örn: 'Faturana Yansıt'.", en: "The product name, e.g. 'Faturana Yansıt'." } } },
        { name: "description", type: "textarea", required: true,
          admin: { description: { tr: "Ürünün kısa açıklaması.", en: "A short description of the product." } } },
      ],
    },
  ],
};

const ImageTextSlidesBlock: Block = {
  slug: "imageTextSlides",
  labels: {
    singular: { tr: "Görsel + Metin Slayt Bloğu", en: "Image + Text Slides Block" },
    plural: { tr: "Görsel + Metin Slayt Blokları", en: "Image + Text Slides Blocks" },
  },
  admin: {
    images: blockThumb(
      `<text x="30" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Neler Kazanırsın?</text><rect x="30" y="44" width="130" height="90" rx="6" fill="url(#slideGrad)"/><text x="42" y="76" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#ffffff">%5</text><text x="30" y="152" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Puan Kazan</text><rect x="30" y="160" width="90" height="8" rx="2" fill="#d1d5db"/><rect x="180" y="44" width="130" height="90" rx="6" fill="url(#slideGrad)"/><text x="192" y="76" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#ffffff">₺0</text><text x="180" y="152" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Yıllık Ücret</text><rect x="180" y="160" width="90" height="8" rx="2" fill="#d1d5db"/><rect x="330" y="44" width="130" height="90" rx="6" fill="url(#slideGrad)"/><text x="342" y="76" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#ffffff">7/24</text><text x="330" y="152" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">Anında Bakiye</text><rect x="330" y="160" width="90" height="8" rx="2" fill="#d1d5db"/><path d="M400 240 h50 M436 228 l16 12 l-16 12" stroke="#e60000" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      vfImageFill("slideGrad")
    ),
  },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: { description: { tr: "Bölümün başlığı, örn: 'Neler Kazanırsın?'. Boş bırakılabilir.", en: "The section's heading, e.g.: 'Neler Kazanırsın?'. Optional." } },
    },
    {
      // Migration follow-up (28.08): fills the gap ImageSideCarousel.tsx's
      // layout left — a fixed side image + a paragraph next to a
      // one-slide-at-a-time carousel (used by hand-written /vodafone-pay-kart's
      // "Kartla Kazan" section). Both optional and independent of each other:
      // leaving both empty keeps this block's original scroller-of-slides
      // rendering (BlockRenderer switches on `sideImage` alone) — nothing
      // about any EXISTING use of this block changes.
      name: "intro",
      type: "textarea",
      admin: {
        description: {
          tr: "Başlığın altındaki açıklama paragrafı. Boş bırakılabilir.",
          en: "The paragraph under the heading. Optional.",
        },
      },
    },
    {
      name: "sideImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: {
          tr: "Doldurulursa slaytlar, bu sabit görselin yanında TEK SEFERDE bir slayt gösteren bir karusel olarak render edilir (noktalarla gezinilir) — boş bırakılırsa slaytlar yatay kaydırmalı bir şerit olarak kalır.",
          en: "If set, the slides render as a carousel showing ONE slide at a time next to this fixed image (dot navigation) — leave empty to keep the slides as a horizontal scrolling strip.",
        },
      },
    },
    {
      name: "slides",
      type: "array",
      minRows: 1,
      admin: {
        description: {
          tr: "Her satır bir slayt (görsel + açıklama metni). '+ Slayt Ekle' ile yenisini ekleyin, sürükleyerek sırasını değiştirin.",
          en: "Each row is one slide (image + text). Use '+ Add Slide' to add a new one, drag to reorder.",
        },
      },
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true, admin: { description: { tr: "Slaytın görseli.", en: "The slide's image." } } },
        { name: "text", type: "textarea", required: true, admin: { description: { tr: "Slaytın açıklama metni.", en: "The slide's text." } } },
      ],
    },
  ],
};

const VideoListBlock: Block = {
  slug: "videoList",
  labels: {
    singular: { tr: "Çoklu Video Bloğu", en: "Video List Block" },
    plural: { tr: "Çoklu Video Blokları", en: "Video List Blocks" },
  },
  admin: {
    images: blockThumb(
      `<rect x="40" y="40" width="130" height="30" rx="4" fill="#e60000"/><text x="105" y="60" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Nasıl Kullanılır</text><rect x="178" y="40" width="120" height="30" rx="4" fill="#f3f4f6"/><text x="238" y="60" font-family="Arial, sans-serif" font-size="11" fill="#6b7280" text-anchor="middle">Kart Başvurusu</text><rect x="306" y="40" width="90" height="30" rx="4" fill="#f3f4f6"/><text x="351" y="60" font-family="Arial, sans-serif" font-size="11" fill="#6b7280" text-anchor="middle">SSS</text><rect x="40" y="90" width="400" height="170" rx="8" fill="url(#vlGrad)"/><circle cx="240" cy="175" r="30" fill="#ffffff" opacity="0.92"/><path d="M228 158 L228 192 L260 175 Z" fill="#e60000"/>`,
      vfImageFill("vlGrad")
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: { tr: "Bölümün başlığı. Boş bırakılabilir.", en: "The section's heading. Optional." } } },
    {
      // Migration follow-up (28.08): closes the gap VideoGuideSection.tsx's
      // dark full-bleed layout left (hand-written /vodafone-pay-kart's
      // "Fiziksel Kart nerelerde kullanılır?" section) — a heading + a
      // second line under it, over a full-width background image with white
      // text. Both optional and independent: leaving `darkBackgroundImage`
      // empty keeps this block's original light-card-grid rendering
      // (BlockRenderer switches on `darkBackgroundImage` alone) — no
      // EXISTING use of this block changes.
      name: "subheading",
      type: "text",
      admin: {
        description: {
          tr: "Başlığın altındaki ikinci satır. Sadece 'Koyu Zemin Görseli' doluyken gösterilir. Boş bırakılabilir.",
          en: "A second line under the heading. Only shown while 'Dark Background Image' is set. Optional.",
        },
      },
    },
    {
      name: "darkBackgroundImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: {
          tr: "Doldurulursa bölüm, bu görseli tam genişlikte zemin yapan koyu bir panel olarak render edilir (başlık/alt başlık/video etiketleri beyaz) — boş bırakılırsa videolar açık renkli kart ızgarası olarak kalır.",
          en: "If set, the section renders as a dark panel with this image as a full-width background (heading/subheading/video labels in white) — leave empty to keep the videos as a light card grid.",
        },
      },
    },
    {
      name: "videos",
      type: "array",
      minRows: 1,
      admin: {
        description: {
          tr: "Her satır bir video (sekme başlığı + video). Tek video için de kullanılabilir; birden fazla eklenirse sekmeli gösterilir.",
          en: "Each row is one video (tab title + video). Can also be used for a single video; if more than one is added, it shows as tabs.",
        },
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          admin: { description: { tr: "Bu videonun sekme/başlık metni, örn: 'Nasıl Kart Alırım?'.", en: "This video's tab/title text, e.g.: 'Nasıl Kart Alırım?'." } },
        },
        {
          name: "youtubeId",
          type: "text",
          required: true,
          admin: {
            description: {
              tr: "Sadece video ID'si — tam URL değil. https://www.youtube.com/watch?v=ABC123XYZ adresindeki ABC123XYZ kısmını yazın.",
              en: "Just the video ID — not the full URL. Enter the ABC123XYZ part of https://www.youtube.com/watch?v=ABC123XYZ.",
            },
          },
        },
      ],
    },
  ],
};

/**
 * Migration follow-up (28.08): a "marker" block with no editable fields.
 * VideosWithTabs.tsx (tabbed video-thumbnail scroller) and LeadFormCta.tsx
 * (banner + a non-functional "Formu doldurun" button) are not CMS content —
 * their copy is fixed placeholder/decorative chrome specific to
 * /faturana-yansit, not something an editor edits per-page. But when that
 * page moved from a hand-written route into a Pages document, these two
 * pieces still needed a way to be POSITIONED in the page's layout (added,
 * removed, reordered like any other section) without pretending they carry
 * editable content they don't have. An editor drags this block in exactly
 * where the fixed component should render; BlockRenderer renders the real
 * component with no props.
 */
const VideosWithTabsMarkerBlock: Block = {
  slug: "videosWithTabsMarker",
  labels: {
    // The label itself carries the "nothing to edit" note — Payload's Block
    // type has no `admin.description` (field-level only), and this block is
    // deliberately fields:[] so there's nowhere else to put it.
    singular: {
      tr: "Sekmeli Video Tanıtımı (Sabit, Düzenlenemez)",
      en: "Tabbed Video Showcase (Fixed, Not Editable)",
    },
    plural: {
      tr: "Sekmeli Video Tanıtımları (Sabit, Düzenlenemez)",
      en: "Tabbed Video Showcases (Fixed, Not Editable)",
    },
  },
  fields: [],
};

/** See VideosWithTabsMarkerBlock's comment — same reasoning, for LeadFormCta.tsx. */
const LeadFormCtaBlock: Block = {
  slug: "leadFormCta",
  labels: {
    singular: { tr: "Form Çağrısı Bannerı (Sabit, Düzenlenemez)", en: "Lead Form Banner (Fixed, Not Editable)" },
    plural: { tr: "Form Çağrısı Bannerları (Sabit, Düzenlenemez)", en: "Lead Form Banners (Fixed, Not Editable)" },
  },
  fields: [],
};

/**
 * Butterfly-parity gap-fill (docs/PAGE-CREATE-PRODUCTION.MD analysis,
 * docs/RFP-OPEN-ITEMS.md §8): slug used to be a required, hand-typed field —
 * every other slugged collection (BlogPosts, Categories) already
 * auto-generates from `title` via `turkishSlugify`/`uniqueSlug`. Same
 * pattern here: only fires on create, never re-derives on update so a
 * published page's URL can't shift under an editor fixing a title typo.
 */
export const generateSlug: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== "create" || !data?.title) return data;
  const base = turkishSlugify(data.title as string);
  data.slug = await uniqueSlug(base, async (candidate) => {
    const { totalDocs } = await req.payload.count({
      collection: "pages",
      where: { slug: { equals: candidate } },
      overrideAccess: true,
    });
    return totalDocs > 0;
  });
  return data;
};

/** Same `createdBy` provenance pattern as Campaigns.ts — set once, on create, never editable after. */
export const setCreatedBy: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === "create" && req.user?.id) {
    data.createdBy = req.user.id;
  }
  return data;
};

/**
 * `parent`'s admin `filterOptions` (below) already hides a document from
 * its own parent dropdown, but that's UI-only — a direct API call could
 * still set `parent` to the document's own id. Server-side guard, same
 * reasoning as every other filterOptions pairing in this codebase (see
 * Categories/BlogPosts' `filterOptions` comments).
 */
export const preventSelfParent: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  const targetId = originalDoc?.id;
  if (targetId != null && data?.parent != null && String(data.parent) === String(targetId)) {
    const message = req.i18n?.language === "en" ? "A page cannot be its own parent." : "Bir sayfa kendi üst sayfası olamaz.";
    throw new APIError(message, 400, undefined, true);
  }
  return data;
};

/**
 * Butterfly-parity gap-fill: `visibility` (public/private). Reuses
 * `publishedOrAuthenticated`'s exact logic (logged-in CMS users and the
 * site's preview-secret fetch see everything regardless of status) and
 * layers one more constraint on top for anonymous readers — public API
 * requests only ever see `visibility: "public"` pages, same shape as the
 * existing `_status: "published"` constraint. A private page therefore
 * never reaches `getPageBySlug`/`getPages` on the public site (both fetch
 * unauthenticated), so it 404s for visitors and is invisible to
 * `generateStaticParams`/sitemap.ts — no site-side gating code needed, the
 * access function is the only thing that has to know about `visibility`.
 */
export const pagesRead: Access = (args) => {
  const base = publishedOrAuthenticated(args);
  if (base === true) return true;
  return { and: [base as Where, { visibility: { equals: "public" } }] };
};

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: {
    singular: dbLabel("collectionLabel.pages.singular", { tr: "Sayfa", en: "Page" }),
    plural: dbLabel("collectionLabel.pages.plural", { tr: "Sayfalar", en: "Pages" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status"],
    group: { tr: "İçerik Yönetimi", en: "Content Management" },
    description: {
      tr: "Yeni sayfalar (kampanya landing, hub sayfası vb.) — geliştirici gerekmeden, blokları sürükleyip bırakarak oluşturulur. İlk defa mı yapıyorsunuz? Yukarıdaki '?' butonuna basın — adım adım anlatım orada.",
      en: "New pages (campaign landing, hub page, etc.) — built by dragging and dropping blocks, no developer needed. First time? Click the '?' button above — the step-by-step walkthrough is there.",
    },
    preview: (doc) => (typeof doc.slug === "string" ? sitePreviewUrl(`/${doc.slug}`) : null),
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "pages" } }],
      // RFP follow-up: an editor confused mid-way through building a page
      // (which block to use, how to connect it to the menu) was stuck on the
      // create/edit view, where HelpButton wasn't rendered at all — only on
      // the list, one screen back. Same component, second placement.
      edit: {
        beforeDocumentControls: [{ path: "/components/HelpButton#default", clientProps: { collection: "pages" } }],
      },
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    read: pagesRead,
    readVersions: authenticated,
    create: newVerticalCreate,
    update: newVerticalReadWrite,
    delete: isNewVerticalMaker,
  },
  fields: [
    // RFP feedback 5.7: was `localized: true` — the only localized field in the
    // whole CMS, which is why the content-locale selector appeared in the
    // header while switching it changed nothing. See payload.config.ts.
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: {
          tr: "Sayfanın adı — hem sayfanın başlığı hem de URL'nin otomatik türetileceği kaynak metin.",
          en: "The page's name — both the page's title and the source text the URL is auto-derived from.",
        },
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        description: { tr: "URL için otomatik oluşturulur: /{slug}", en: "Auto-generated for the URL: /{slug}" },
      },
    },
    {
      name: "layout",
      type: "blocks",
      minRows: 1,
      admin: {
        description: {
          tr: "Sayfa, aşağıya eklediğiniz bloklardan yukarıdan aşağı sırayla oluşur — her blok bir bölüm demektir. Sürükleyerek sırasını değiştirebilir, çöp kutusuyla silebilirsiniz. '+ Layout Ekle'deki kartların üzerindeki küçük görsel her bloğun ne işe yaradığını gösterir; hangi bloğu ne zaman kullanacağınızın TAM listesi sayfanın en üstündeki '?' (Yardım) butonunda. Bu sayfayı header'daki 'Ürünler' menüsünde göstermek için sağdaki ''Ürünler' Menüsünde Göster' kutusunu işaretlemeniz yeterli; footer ve Ana Menü hâlâ 'Menü Linkleri' koleksiyonundan yönetiliyor (Yardım'da anlatılıyor).",
          en: "The page is built top-to-bottom from the blocks you add below — each block is one section. Drag to reorder, use the trash icon to delete. The small image on each '+ Add Layout' card shows what that block is for; the FULL list of which block to use when is in the '?' (Help) button at the top of the page. To show this page in the header's 'Products' menu just tick 'Show in the 'Products' Menu' in the sidebar; the footer and Main Menu are still managed from the 'Nav Links' collection (explained in Help).",
        },
      },
      blocks: [
        HeroBlock,
        RichTextBlock,
        FaqListBlock,
        CampaignGridBlock,
        VideoBlock,
        LogoGridBlock,
        IconCardsBlock,
        StepsBlock,
        HowToEarnBlock,
        ImageWithTextBlock,
        PricesAndLimitsBlock,
        BlogGridBlock,
        FeatureHighlightsBlock,
        ProfileGridBlock,
        StepPhonesBlock,
        MediaPanelBlock,
        ContactInfoBlock,
        RepresentativesBlock,
        ImageTextSlidesBlock,
        VideoListBlock,
        VideosWithTabsMarkerBlock,
        LeadFormCtaBlock,
      ],
    },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
    seoKeywordsField,
    { name: "ogImage", type: "upload", relationTo: "media" },
    {
      // Butterfly-parity gap-fill: simple parent reference for a breadcrumb
      // trail (Ana Sayfa > Üst Sayfa > Bu Sayfa) — deliberately NOT full
      // nested routing (URL stays flat /{slug}); site menu hierarchy is
      // already NavLinks' job, this is purely a breadcrumb/grouping aid.
      name: "parent",
      type: "relationship",
      relationTo: "pages",
      label: { tr: "Üst Sayfa", en: "Parent Page" },
      admin: {
        position: "sidebar",
        description: {
          tr: "Sadece breadcrumb'da gösterilir (Ana Sayfa > Üst Sayfa > Bu Sayfa) — URL /{slug} olarak düz kalır. Bu listede sadece DAHA ÖNCE oluşturup kaydettiğiniz başka Page'ler çıkar — ilk sayfanızı oluştururken liste boş görünür, bu bir hata değildir. Örnek: önce 'Kurumsal' adında bir Page oluşturup kaydedin, sonra 'Ekibimiz' adında ikinci bir Page oluşturup Üst Sayfa alanından 'Kurumsal'ı seçin.",
          en: "Only affects the breadcrumb trail (Home > Parent > This page) — the URL stays flat at /{slug}. This list only shows OTHER Pages you've already created and saved — it's empty for your very first page, that's expected, not a bug. Example: create and save a page called 'Kurumsal' first, then create a second page 'Ekibimiz' and pick 'Kurumsal' here.",
        },
      },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    {
      // Butterfly-parity gap-fill: public/private visibility, independent of
      // draft/published — a private+published page still counts as "live"
      // in every editorial workflow, it's just never served to an
      // unauthenticated site visitor (see `pagesRead` above).
      name: "visibility",
      type: "select",
      defaultValue: "public",
      label: { tr: "Görünürlük", en: "Visibility" },
      options: [
        { label: { tr: "Herkese Açık", en: "Public" }, value: "public" },
        { label: { tr: "Gizli (yalnızca CMS oturumu ile görünür)", en: "Private (only visible with a CMS session)" }, value: "private" },
      ],
      admin: {
        position: "sidebar",
        description: {
          tr: "Gizli sayfa yayınlansa bile ziyaretçilere gösterilmez, sitemap/statik derlemeye dahil edilmez — sadece giriş yapmış CMS kullanıcıları veya önizleme bağlantısıyla görülebilir.",
          en: "A private page is never served to visitors even when published, and is excluded from the sitemap/static build — only logged-in CMS users or the preview link can see it.",
        },
      },
    },
    {
      /**
       * RFP follow-up: bir sayfayı kaydedip yayınlamak, onu header'daki
       * "Ürünler" menüsünde göstermeye yetmiyordu — editörün AYRI bir
       * koleksiyona (NavLinks) gidip elle, doğru slug'ı kendi yazarak bir
       * link kaydı açması gerekiyordu. Sayfanın kendi ekranında "menüde
       * görünsün mü" diye bir seçenek olmaması, canlıdaki 5 ürün sayfasının
       * neden kodda sabit bir dizide durduğunun da sebebiydi.
       *
       * Bu kutu o adımı sayfanın kendi kaydına taşıyor: işaretlendiğinde
       * site header'ı sayfayı doğrudan Pages'ten okuyup menüye ekler (bkz.
       * site tarafında `getProductsMenuPages` + `Header.tsx`). Slug elle
       * yazılmadığı için "menüdeki link yanlış sayfaya gidiyor" hatası da
       * yapısal olarak imkânsız hale geliyor.
       *
       * NavLinks KALDIRILMADI: hâlâ Pages'te olmayan elle yazılmış rotalar
       * (/faturana-yansit, /vodafone-pay-kart) ve dış bağlantılar için tek
       * yol o. Header iki kaynağı birleştirir.
       */
      name: "showInProductsMenu",
      type: "checkbox",
      defaultValue: false,
      label: { tr: "'Ürünler' Menüsünde Göster", en: "Show in the 'Products' Menu" },
      admin: {
        position: "sidebar",
        description: {
          tr: "İşaretlerseniz bu sayfa, header'daki 'Ürünler' açılır menüsünde otomatik listelenir — Menü Linkleri'ne ayrıca kayıt açmanıza gerek kalmaz. Menüde ancak sayfa YAYINLANDIĞINDA ve Görünürlük 'Herkese Açık' olduğunda çıkar.",
          en: "Check this and the page is automatically listed in the header's 'Products' dropdown — no separate Nav Links record needed. It only appears once the page is PUBLISHED and its Visibility is 'Public'.",
        },
      },
    },
    {
      name: "productsMenuLabel",
      type: "text",
      label: { tr: "Menüde Görünecek İsim", en: "Label in the Menu" },
      admin: {
        position: "sidebar",
        condition: (data) => Boolean(data?.showInProductsMenu),
        description: {
          tr: "Boş bırakırsanız sayfanın Başlığı kullanılır. Sadece menüde daha kısa/farklı bir yazı görünmesini istiyorsanız doldurun (örn. başlık 'Vodafone Pay Kart Nedir?' iken menüde 'Vodafone Pay Kart').",
          en: "Leave empty to use the page's Title. Fill this in only if the menu should show shorter/different text (e.g. title 'Vodafone Pay Kart Nedir?' but menu 'Vodafone Pay Kart').",
        },
      },
    },
    {
      // Same shape as FaqItems' showOnHomepage/homepageOrder pair
      // (assignNextFlaggedOrder, hooks/ordering.ts) — audited alongside it
      // (28.08) and found missing the matching LiveOrderField widget that
      // homepageOrder already has, purely an oversight from when this field
      // was added, not an intentional difference.
      name: "productsMenuOrder",
      type: "number",
      min: 1,
      label: { tr: "Menüdeki Sırası", en: "Position in the Menu" },
      admin: {
        position: "sidebar",
        condition: (data) => Boolean(data?.showInProductsMenu),
        description: {
          tr: "'Ürünler' menüsündeki sırası — 1'den başlar, küçük sayı üstte görünür. Boş bırakırsanız otomatik olarak sona eklenir. Menüde ayrıca Menü Linkleri'nden gelen kayıtlar da varsa, ikisi tek listede bu numaraya göre birlikte sıralanır.",
          en: "Position in the 'Products' menu — starts at 1, lower shows higher up. Leave empty to append to the end. If the menu also has Nav Links records, both sources are sorted together in one list by this number.",
        },
        components: {
          Field: {
            path: "/components/LiveOrderField#default",
            clientProps: { collection: "pages", watchPath: "showInProductsMenu", mode: "boolean" },
          },
        },
      },
    },
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      label: { tr: "Oluşturan", en: "Created By" },
      admin: { position: "sidebar", readOnly: true },
    },
    {
      // RFP §3.1.7: "Each content item should have a deeplink field in
      // order to enable redirection." Data-model only for now — unlike
      // BlogPosts/FaqItems (one shared render point each), a Page's layout
      // is fully block-composed with no single natural slot to place this;
      // wiring it into the site's [...slug]/page.tsx renderer is a
      // follow-up, not done in this pass.
      name: "deeplink",
      type: "text",
      label: { tr: "İlgili Bağlantı", en: "Related Link" },
      admin: {
        position: "sidebar",
        description: {
          tr: "Opsiyonel — ileride sayfanın altında gösterilecek ilgili bir bağlantı için ayrılmış alan (site tarafında henüz render edilmiyor).",
          en: "Optional — reserved for a related link to be shown below the page (not yet rendered on the site).",
        },
      },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeValidate: [generateSlug, preventSelfParent],
    beforeChange: [
      setCreatedBy,
      assignNextFlaggedOrder({ collection: "pages", flagField: "showInProductsMenu", orderField: "productsMenuOrder" }),
    ],
    afterChange: [revalidateTag("pages"), auditAfterChange("pages")],
    afterDelete: [revalidateTagOnDelete("pages"), auditAfterDelete("pages")],
  },
};
