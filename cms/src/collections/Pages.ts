import { APIError } from "payload";
import type { Access, Block, CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig, Where } from "payload";
import { isNewVerticalMaker, newVerticalCreate, newVerticalReadWrite } from "@/access/roles";
import { authenticated, publishedOrAuthenticated, denyUnauthenticatedDraftRead } from "@/access/authenticated";
import { revalidateTag, revalidateTagOnDelete } from "@/hooks/revalidate";
import { auditAfterChange, auditAfterDelete } from "@/hooks/audit";
import { sitePreviewUrl } from "@/lib/preview";
import { dbLabel } from "@/lib/collectionLabels";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";

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
 */
function blockThumb(inner: string): { thumbnail: { url: string; alt: string } } {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" width="480" height="320"><rect width="480" height="320" fill="#ffffff"/>${inner}</svg>`;
  return { thumbnail: { url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, alt: "" } };
}

const HeroBlock: Block = {
  slug: "hero",
  labels: {
    singular: "Hero (Başlık + Görsel)",
    plural: "Hero Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="20" y="20" width="440" height="180" rx="8" fill="#e5e7eb"/><path d="M20 170 L140 110 L220 160 L320 90 L460 170 Z" fill="#d1d5db"/><circle cx="120" cy="80" r="20" fill="#f3f4f6"/><rect x="20" y="216" width="440" height="84" rx="4" fill="#f3f4f6"/><rect x="150" y="236" width="180" height="14" rx="3" fill="#111827"/><rect x="190" y="258" width="100" height="8" rx="2" fill="#9ca3af"/><rect x="200" y="276" width="80" height="18" rx="4" fill="#e60000"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", required: true, admin: { description: "Büyük, kalın başlık. Örnek: 'Yaz Kampanyası 2026'" } },
    { name: "subheading", type: "text", admin: { description: "Başlığın altında, daha küçük yazan destek cümlesi. Boş bırakılabilir." } },
    { name: "image", type: "upload", relationTo: "media", required: true, admin: { description: "Sayfanın en üstünde tam genişlikte görünecek büyük görsel." } },
    { name: "ctaLabel", type: "text", admin: { description: "Buton üzerinde yazacak metin, örn: 'Detayları Gör'. Boş bırakılırsa buton hiç gösterilmez." } },
    { name: "ctaUrl", type: "text", admin: { description: "Butona tıklayınca gidilecek adres, örn: /kampanyalar veya https://... . ctaLabel doluysa bu da dolu olmalı." } },
  ],
};

const RichTextBlock: Block = {
  slug: "richText",
  labels: {
    singular: "Metin Bloğu",
    plural: "Metin Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="40" y="40" width="200" height="18" rx="3" fill="#111827"/><rect x="40" y="80" width="400" height="10" rx="2" fill="#9ca3af"/><rect x="40" y="100" width="400" height="10" rx="2" fill="#9ca3af"/><rect x="40" y="120" width="320" height="10" rx="2" fill="#9ca3af"/><rect x="40" y="150" width="400" height="10" rx="2" fill="#9ca3af"/><rect x="40" y="170" width="400" height="10" rx="2" fill="#9ca3af"/><rect x="40" y="190" width="260" height="10" rx="2" fill="#9ca3af"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: "Bu metin bölümünün başlığı, örn: 'Vizyonumuz'. Boş bırakılırsa başlıksız sadece metin gösterilir." } },
    { name: "body", type: "richText", required: true },
  ],
};

const FaqListBlock: Block = {
  slug: "faqList",
  labels: {
    singular: "SSS Bloğu",
    plural: "SSS Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="40" y="40" width="400" height="60" rx="6" fill="#f3f4f6"/><rect x="60" y="64" width="240" height="12" rx="3" fill="#111827"/><path d="M410 64 l10 10 l10 -10" stroke="#e60000" stroke-width="4" fill="none"/><rect x="40" y="130" width="400" height="60" rx="6" fill="#f3f4f6"/><rect x="60" y="154" width="240" height="12" rx="3" fill="#111827"/><path d="M410 154 l10 10 l10 -10" stroke="#e60000" stroke-width="4" fill="none"/><rect x="40" y="220" width="400" height="60" rx="6" fill="#f3f4f6"/><rect x="60" y="244" width="240" height="12" rx="3" fill="#111827"/><path d="M410 244 l10 10 l10 -10" stroke="#e60000" stroke-width="4" fill="none"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: "SSS bölümünün başlığı, örn: 'Sıkça Sorulan Sorular'. Boş bırakılabilir." } },
    {
      name: "category",
      type: "text",
      admin: {
        description:
          "Sadece BELİRLİ bir kategorideki soruları göstermek için Kategoriler koleksiyonundaki (Akış: Sık Sorulanlar) o kategorinin slug'ını yazın, örn: kampanyalar. Boş bırakılırsa SSS akışındaki TÜM sorular gelir.",
      },
    },
  ],
};

const CampaignGridBlock: Block = {
  slug: "campaignGrid",
  labels: {
    singular: "Kampanya Grid Bloğu",
    plural: "Kampanya Grid Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="40" y="40" width="130" height="90" rx="6" fill="#e5e7eb"/><rect x="40" y="140" width="130" height="10" rx="2" fill="#111827"/><rect x="40" y="156" width="90" height="8" rx="2" fill="#9ca3af"/><rect x="190" y="40" width="130" height="90" rx="6" fill="#e5e7eb"/><rect x="190" y="140" width="130" height="10" rx="2" fill="#111827"/><rect x="190" y="156" width="90" height="8" rx="2" fill="#9ca3af"/><rect x="340" y="40" width="130" height="90" rx="6" fill="#e5e7eb"/><rect x="340" y="140" width="130" height="10" rx="2" fill="#111827"/><rect x="340" y="156" width="90" height="8" rx="2" fill="#9ca3af"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", required: true, admin: { description: "Vitrinin başlığı, örn: 'Size Özel Kampanyalar'." } },
    {
      name: "category",
      type: "text",
      admin: {
        description:
          "Sadece BELİRLİ bir kategorideki kampanyaları göstermek için Kategoriler koleksiyonundaki (Akış: Kampanyalar) o kategorinin slug'ını yazın, örn: kart. Boş bırakılırsa TÜM aktif kampanyalar gelir.",
      },
    },
  ],
};

const VideoBlock: Block = {
  slug: "video",
  labels: {
    singular: "Video Bloğu",
    plural: "Video Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="60" y="40" width="360" height="220" rx="8" fill="#111827"/><circle cx="240" cy="150" r="36" fill="#ffffff" opacity="0.9"/><path d="M228 130 L228 170 L262 150 Z" fill="#e60000"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: "Videonun üstünde gösterilecek başlık. Boş bırakılabilir." } },
    {
      name: "youtubeId",
      type: "text",
      required: true,
      admin: {
        description:
          "Sadece video ID'si — tam URL değil. https://www.youtube.com/watch?v=ABC123XYZ adresindeki ABC123XYZ kısmını yazın.",
      },
    },
  ],
};

const LogoGridBlock: Block = {
  slug: "logoGrid",
  labels: {
    singular: "Logo Grid Bloğu",
    plural: "Logo Grid Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="40" y="130" width="64" height="60" rx="4" fill="#f3f4f6" stroke="#9ca3af"/><rect x="124" y="130" width="64" height="60" rx="4" fill="#f3f4f6" stroke="#9ca3af"/><rect x="208" y="130" width="64" height="60" rx="4" fill="#f3f4f6" stroke="#9ca3af"/><rect x="292" y="130" width="64" height="60" rx="4" fill="#f3f4f6" stroke="#9ca3af"/><rect x="376" y="130" width="64" height="60" rx="4" fill="#f3f4f6" stroke="#9ca3af"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: "Vitrinin başlığı, örn: 'Anlaşmalı Kartlar'. Boş bırakılabilir." } },
    {
      name: "logos",
      type: "array",
      minRows: 1,
      admin: { description: "Her satır bir logo. '+ Logo Ekle' ile yenisini ekleyin, sürükleyerek sırasını değiştirin." },
      fields: [
        { name: "name", type: "text", required: true, admin: { description: "Logonun adı (ekranda görünmez, erişilebilirlik/alt-text için)." } },
        { name: "logo", type: "upload", relationTo: "media", required: true, admin: { description: "Logo görseli." } },
        { name: "linkUrl", type: "text", admin: { description: "Logoya tıklayınca gidilecek adres. Boş bırakılırsa logo tıklanamaz olur." } },
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
    singular: "İkonlu Kartlar Bloğu",
    plural: "İkonlu Kartlar Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="40" y="40" width="130" height="150" rx="8" fill="#f9fafb" stroke="#e5e7eb"/><circle cx="105" cy="80" r="18" fill="#e60000" opacity="0.85"/><rect x="55" y="115" width="100" height="10" rx="2" fill="#111827"/><rect x="55" y="135" width="100" height="8" rx="2" fill="#9ca3af"/><rect x="55" y="150" width="70" height="8" rx="2" fill="#9ca3af"/><rect x="190" y="40" width="130" height="150" rx="8" fill="#f9fafb" stroke="#e5e7eb"/><circle cx="255" cy="80" r="18" fill="#e60000" opacity="0.85"/><rect x="205" y="115" width="100" height="10" rx="2" fill="#111827"/><rect x="205" y="135" width="100" height="8" rx="2" fill="#9ca3af"/><rect x="205" y="150" width="70" height="8" rx="2" fill="#9ca3af"/><rect x="340" y="40" width="130" height="150" rx="8" fill="#f9fafb" stroke="#e5e7eb"/><circle cx="405" cy="80" r="18" fill="#e60000" opacity="0.85"/><rect x="355" y="115" width="100" height="10" rx="2" fill="#111827"/><rect x="355" y="135" width="100" height="8" rx="2" fill="#9ca3af"/><rect x="355" y="150" width="70" height="8" rx="2" fill="#9ca3af"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: "Bölümün başlığı, örn: 'Akıllı Ödeme Yöntemleri'. Boş bırakılabilir." } },
    {
      name: "cards",
      type: "array",
      minRows: 1,
      admin: { description: "Her satır bir kart (ikon + başlık + kısa açıklama). '+ Kart Ekle' ile yenisini ekleyin, sürükleyerek sırasını değiştirin. Genelde 3 kart kullanılır." },
      fields: [
        { name: "icon", type: "upload", relationTo: "media", required: true, admin: { description: "Küçük ikon görseli." } },
        { name: "title", type: "text", required: true, admin: { description: "Kartın başlığı, örn: 'Size Özel Limit'." } },
        { name: "text", type: "textarea", required: true, admin: { description: "Kartın kısa açıklama metni, 1-2 cümle." } },
      ],
    },
  ],
};

const StepsBlock: Block = {
  slug: "steps",
  labels: {
    singular: "Adım Listesi Bloğu",
    plural: "Adım Listesi Blokları",
  },
  admin: {
    images: blockThumb(
      `<circle cx="70" cy="55" r="18" fill="#e60000"/><text x="70" y="60" font-size="14" fill="#ffffff" text-anchor="middle" font-family="sans-serif">01</text><rect x="115" y="35" width="60" height="40" rx="4" fill="#e5e7eb"/><rect x="190" y="45" width="260" height="10" rx="2" fill="#9ca3af"/><rect x="190" y="61" width="200" height="10" rx="2" fill="#9ca3af"/><circle cx="70" cy="140" r="18" fill="#e60000"/><text x="70" y="145" font-size="14" fill="#ffffff" text-anchor="middle" font-family="sans-serif">02</text><rect x="115" y="120" width="60" height="40" rx="4" fill="#e5e7eb"/><rect x="190" y="130" width="260" height="10" rx="2" fill="#9ca3af"/><rect x="190" y="146" width="200" height="10" rx="2" fill="#9ca3af"/><circle cx="70" cy="225" r="18" fill="#e60000"/><text x="70" y="230" font-size="14" fill="#ffffff" text-anchor="middle" font-family="sans-serif">03</text><rect x="115" y="205" width="60" height="40" rx="4" fill="#e5e7eb"/><rect x="190" y="215" width="260" height="10" rx="2" fill="#9ca3af"/><rect x="190" y="231" width="200" height="10" rx="2" fill="#9ca3af"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: "Bölümün başlığı, örn: 'Nasıl Kullanırım?'. Boş bırakılabilir." } },
    {
      name: "steps",
      type: "array",
      minRows: 1,
      admin: { description: "Her satır bir adım (sıra numarası + açıklama + o adımı gösteren görsel). '+ Adım Ekle' ile yenisini ekleyin, sürükleyerek sırasını değiştirin." },
      fields: [
        { name: "number", type: "text", required: true, admin: { description: "Adım numarası, örn: '01', '02'." } },
        { name: "text", type: "textarea", required: true, admin: { description: "Bu adımda kullanıcının ne yapacağını anlatan metin." } },
        { name: "image", type: "upload", relationTo: "media", required: true, admin: { description: "Bu adımı gösteren ekran görüntüsü/görsel." } },
      ],
    },
  ],
};

const ImageTextSlidesBlock: Block = {
  slug: "imageTextSlides",
  labels: {
    singular: "Görsel + Metin Slayt Bloğu",
    plural: "Görsel + Metin Slayt Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="30" y="60" width="130" height="90" rx="6" fill="#e5e7eb"/><rect x="30" y="158" width="130" height="8" rx="2" fill="#9ca3af"/><rect x="30" y="172" width="90" height="8" rx="2" fill="#9ca3af"/><rect x="180" y="60" width="130" height="90" rx="6" fill="#e5e7eb"/><rect x="180" y="158" width="130" height="8" rx="2" fill="#9ca3af"/><rect x="180" y="172" width="90" height="8" rx="2" fill="#9ca3af"/><rect x="330" y="60" width="130" height="90" rx="6" fill="#e5e7eb"/><rect x="330" y="158" width="130" height="8" rx="2" fill="#9ca3af"/><rect x="330" y="172" width="90" height="8" rx="2" fill="#9ca3af"/><rect x="466" y="60" width="14" height="90" rx="3" fill="#e5e7eb" opacity="0.6"/><path d="M400 240 h50 M436 228 l16 12 l-16 12" stroke="#e60000" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: "Bölümün başlığı, örn: 'Neler Kazanırsın?'. Boş bırakılabilir." } },
    {
      name: "slides",
      type: "array",
      minRows: 1,
      admin: { description: "Her satır bir slayt (görsel + açıklama metni). '+ Slayt Ekle' ile yenisini ekleyin, sürükleyerek sırasını değiştirin." },
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true, admin: { description: "Slaytın görseli." } },
        { name: "text", type: "textarea", required: true, admin: { description: "Slaytın açıklama metni." } },
      ],
    },
  ],
};

const VideoListBlock: Block = {
  slug: "videoList",
  labels: {
    singular: "Çoklu Video Bloğu",
    plural: "Çoklu Video Blokları",
  },
  admin: {
    images: blockThumb(
      `<rect x="40" y="40" width="120" height="30" rx="4" fill="#e60000"/><rect x="170" y="40" width="120" height="30" rx="4" fill="#f3f4f6"/><rect x="300" y="40" width="120" height="30" rx="4" fill="#f3f4f6"/><rect x="40" y="90" width="400" height="170" rx="8" fill="#111827"/><circle cx="240" cy="175" r="30" fill="#ffffff" opacity="0.9"/><path d="M230 158 L230 192 L260 175 Z" fill="#e60000"/>`
    ),
  },
  fields: [
    { name: "heading", type: "text", admin: { description: "Bölümün başlığı. Boş bırakılabilir." } },
    {
      name: "videos",
      type: "array",
      minRows: 1,
      admin: { description: "Her satır bir video (sekme başlığı + video). Tek video için de kullanılabilir; birden fazla eklenirse sekmeli gösterilir." },
      fields: [
        { name: "title", type: "text", required: true, admin: { description: "Bu videonun sekme/başlık metni, örn: 'Nasıl Kart Alırım?'." } },
        {
          name: "youtubeId",
          type: "text",
          required: true,
          admin: {
            description:
              "Sadece video ID'si — tam URL değil. https://www.youtube.com/watch?v=ABC123XYZ adresindeki ABC123XYZ kısmını yazın.",
          },
        },
      ],
    },
  ],
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
    group: { tr: "İçerik", en: "Content" },
    description:
      "Yeni sayfalar (kampanya landing, hub sayfası vb.) — geliştirici gerekmeden, blokları sürükleyip bırakarak oluşturulur. İlk defa mı yapıyorsunuz? Yukarıdaki '?' butonuna basın — adım adım anlatım orada.",
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
    { name: "title", type: "text", required: true, admin: { description: "Sayfanın adı — hem sayfanın başlığı hem de URL'nin otomatik türetileceği kaynak metin." } },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { readOnly: true, description: "URL için otomatik oluşturulur: /{slug}" },
    },
    {
      name: "layout",
      type: "blocks",
      minRows: 1,
      admin: {
        description:
          "Sayfa, aşağıya eklediğiniz bloklardan yukarıdan aşağı sırayla oluşur — her blok bir bölüm demektir. Sürükleyerek sırasını değiştirebilir, çöp kutusuyla silebilirsiniz. '+ Layout Ekle'deki kartların üzerindeki küçük görsel her bloğun ne işe yaradığını gösterir; hangi bloğu ne zaman kullanacağınızın TAM listesi ve ÖNEMLİSİ bu sayfayı 'Ürünler' menüsünde/footer'da nasıl göstereceğinizin adım adım anlatımı, sayfanın en üstündeki '?' (Yardım) butonunda.",
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
        ImageTextSlidesBlock,
        VideoListBlock,
      ],
    },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
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
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      label: { tr: "Oluşturan", en: "Created By" },
      admin: { position: "sidebar", readOnly: true },
    },
  ],
  hooks: {
    beforeOperation: [denyUnauthenticatedDraftRead],
    beforeValidate: [generateSlug, preventSelfParent],
    beforeChange: [setCreatedBy],
    afterChange: [revalidateTag("pages"), auditAfterChange("pages")],
    afterDelete: [revalidateTagOnDelete("pages"), auditAfterDelete("pages")],
  },
};
