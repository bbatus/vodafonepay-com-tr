const CMS_API_URL = process.env.CMS_API_URL || "http://localhost:3010/api";

interface PayloadListResponse<T> {
  docs: T[];
}

interface CmsMedia {
  url: string;
  alt: string;
}

export interface CmsCampaign {
  id: string;
  title: string;
  description: string;
  image: CmsMedia;
  category: string;
  featured: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface CmsFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

async function cmsFetch<T>(path: string, tag: string): Promise<T | null> {
  try {
    const res = await fetch(`${CMS_API_URL}${path}`, {
      next: { tags: [tag], revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // CMS unreachable — callers fall back to their own static content.
    return null;
  }
}

export async function getCampaigns(): Promise<CmsCampaign[] | null> {
  const data = await cmsFetch<PayloadListResponse<CmsCampaign>>(
    "/campaigns?depth=1&limit=100&sort=-createdAt",
    "campaigns"
  );
  return data?.docs ?? null;
}

export function campaignToCard(c: CmsCampaign) {
  return {
    title: c.title,
    description: c.description,
    image: c.image.url,
    imageAlt: c.image.alt || c.title,
    href: c.ctaUrl || "/kampanyalar",
  };
}

export async function getFaqItems(category?: string): Promise<CmsFaqItem[] | null> {
  const query = category ? `&where[category][equals]=${encodeURIComponent(category)}` : "";
  const data = await cmsFetch<PayloadListResponse<CmsFaqItem>>(
    `/faq-items?depth=0&limit=200&sort=order${query}`,
    "faq-items"
  );
  return data?.docs ?? null;
}

export interface CmsBlogPost {
  id: string;
  title: string;
  slug: string;
  coverImage: CmsMedia;
  excerpt: string;
  category?: string;
  publishedDate?: string;
}

export async function getBlogPosts(): Promise<CmsBlogPost[] | null> {
  const data = await cmsFetch<PayloadListResponse<CmsBlogPost>>(
    "/blog-posts?depth=1&limit=100&sort=-publishedDate",
    "blog-posts"
  );
  return data?.docs ?? null;
}

export interface CmsFeeRow {
  id: string;
  label: string;
  value: string;
  order: number;
}

export async function getFeeRows(): Promise<CmsFeeRow[] | null> {
  const data = await cmsFetch<PayloadListResponse<CmsFeeRow>>("/fee-rows?depth=0&limit=200&sort=order", "fee-rows");
  return data?.docs ?? null;
}

export interface CmsLimitTable {
  id: string;
  title: string;
  order: number;
  rows: { category: string; period: string; unverifiedLimit: string; verifiedLimit: string }[];
}

export async function getLimitTables(): Promise<CmsLimitTable[] | null> {
  const data = await cmsFetch<PayloadListResponse<CmsLimitTable>>(
    "/limit-tables?depth=0&limit=100&sort=order",
    "limit-tables"
  );
  return data?.docs ?? null;
}

export type NavLinkSection =
  | "header-products"
  | "header-main"
  | "footer-kurumsal"
  | "footer-sss"
  | "footer-kampanyalar"
  | "footer-yasal";

export interface CmsNavLink {
  id: string;
  label: string;
  href: string;
  section: NavLinkSection;
  order: number;
}

export async function getNavLinks(): Promise<CmsNavLink[] | null> {
  const data = await cmsFetch<PayloadListResponse<CmsNavLink>>(
    "/nav-links?depth=0&limit=200&sort=order",
    "nav-links"
  );
  return data?.docs ?? null;
}

export type ProductHeroPage =
  | "anasayfa"
  | "vodafone-pay-uygulama"
  | "vodafone-pay-kart"
  | "qr-ile-faturana-yansit"
  | "faturana-yansit"
  | "aninda-bakiye";

export interface CmsProductHero {
  id: string;
  page: ProductHeroPage;
  image: CmsMedia;
  heading: string;
}

export async function getProductHero(page: ProductHeroPage): Promise<CmsProductHero | null> {
  const data = await cmsFetch<PayloadListResponse<CmsProductHero>>(
    `/product-heroes?depth=1&limit=1&where[page][equals]=${encodeURIComponent(page)}`,
    "product-heroes"
  );
  return data?.docs?.[0] ?? null;
}

export interface CmsFeatureCard {
  id: string;
  page: string;
  icon: CmsMedia;
  title: string;
  text: string;
  order: number;
}

export async function getFeatureCards(page: string): Promise<CmsFeatureCard[] | null> {
  const data = await cmsFetch<PayloadListResponse<CmsFeatureCard>>(
    `/feature-cards?depth=1&limit=50&sort=order&where[page][equals]=${encodeURIComponent(page)}`,
    "feature-cards"
  );
  return data?.docs ?? null;
}

export interface CmsStepCard {
  id: string;
  page: string;
  number: string;
  text: string;
  image: CmsMedia;
  order: number;
}

export async function getStepCards(page: string): Promise<CmsStepCard[] | null> {
  const data = await cmsFetch<PayloadListResponse<CmsStepCard>>(
    `/step-cards?depth=1&limit=50&sort=order&where[page][equals]=${encodeURIComponent(page)}`,
    "step-cards"
  );
  return data?.docs ?? null;
}

export interface CmsAnnouncement {
  id: string;
  title: string;
  body: string;
  order: number;
}

export async function getAnnouncements(): Promise<CmsAnnouncement[] | null> {
  const data = await cmsFetch<PayloadListResponse<CmsAnnouncement>>(
    "/announcements?depth=0&limit=100&sort=order",
    "announcements"
  );
  return data?.docs ?? null;
}

export type LegalPageSlug =
  | "gizlilik-ve-guvenlik-politikasi"
  | "cerez-politikasi"
  | "bilgi-guvenligi"
  | "sozlesmeler-ve-formlar"
  | "web-sitesi-hukum-ve-sartlari";

export interface CmsLegalPage {
  id: string;
  slug: LegalPageSlug;
  title: string;
  intro: string;
}

export async function getLegalPage(slug: LegalPageSlug): Promise<CmsLegalPage | null> {
  const data = await cmsFetch<PayloadListResponse<CmsLegalPage>>(
    `/legal-pages?depth=0&limit=1&where[slug][equals]=${encodeURIComponent(slug)}`,
    "legal-pages"
  );
  return data?.docs?.[0] ?? null;
}

export interface CmsContactInfo {
  companyName: string;
  tradeRegistryNo: string;
  address: string;
  phone: string;
  kepAddress: string;
  customerServiceText: string;
  tcmbAddress: string;
  tcmbPhone: string;
  tcmbFax: string;
  tcmbKep: string;
  pressRelationsUrl?: string;
}

export async function getContactInfo(): Promise<CmsContactInfo | null> {
  const data = await cmsFetch<CmsContactInfo & { companyName?: string }>("/globals/contact-info", "contact-info");
  return data?.companyName ? data : null;
}

export function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
