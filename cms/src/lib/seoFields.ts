import type { Field } from "payload";

/**
 * RFP §3.2.6 ("meta tags: title/description/keywords"). Google has not used
 * this tag for ranking since 2009 — it carries no real SEO value
 * (RFP-OPEN-ITEMS §2's original reasoning for omitting it entirely) — added
 * anyway per the RFP's literal wording once revisited. Shared across every
 * collection with SEO fields (Campaigns/BlogPosts/PageMeta/Pages) instead of
 * repeating the same field object 4 times.
 */
export const seoKeywordsField: Field = {
  name: "seoKeywords",
  type: "text",
  label: { tr: "SEO Anahtar Kelimeleri", en: "SEO Keywords" },
  admin: {
    description: {
      tr: "Virgülle ayrılmış anahtar kelimeler (ör: mobil ödeme, sanal kart, faturaya yansıt). Not: Google 2009'dan beri bu etiketi sıralamada kullanmıyor — gerçek SEO etkisi yok, yalnızca referans amaçlı.",
      en: "Comma-separated keywords (e.g. mobile payment, virtual card). Note: Google hasn't used this tag for ranking since 2009 — no real SEO impact, informational only.",
    },
  },
};
