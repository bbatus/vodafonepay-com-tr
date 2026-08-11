import { z } from "zod";

const CMS_API_URL = process.env.CMS_API_URL || "http://localhost:3010/api";
const FETCH_TIMEOUT_MS = 8000;

/**
 * Payload returns unset optional fields as JSON `null`, not an omitted key —
 * plain `z.string().optional()` only accepts `undefined`, so it rejected
 * every real document with an empty optional field (confirmed live: CMS
 * "campaigns" and "content-blocks" responses both failed validation this
 * way until this fix). `.nullable()` + a transform normalizes both
 * `null` and `undefined` to a single consistent value.
 */
const nullableString = () => z.string().nullable().optional().transform((v) => v ?? undefined);
const nullableStringDefault = (fallback: string) => z.string().nullable().optional().transform((v) => v ?? fallback);

const mediaSchema = z.object({
  url: z.string(),
  alt: nullableStringDefault(""),
});
type CmsMedia = z.infer<typeof mediaSchema>;

function listResponseSchema<T extends z.ZodTypeAny>(doc: T) {
  return z.object({ docs: z.array(doc) });
}

/**
 * R-08: the old implementation cast the parsed JSON straight to the typed
 * interface with no runtime check, swallowed every error into a bare
 * `null`, and had no request timeout — a hung CMS would hang the page
 * render, and a CMS schema change would fail silently at the type level
 * only, with no signal at runtime. This validates every response against a
 * zod schema, times out, and logs what actually went wrong (endpoint +
 * cause) so a broken CMS integration is visible instead of just quietly
 * falling back to stale/hardcoded content.
 */
async function cmsFetch<T>(path: string, tag: string, schema: z.ZodType<T>): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${CMS_API_URL}${path}`, {
      next: { tags: [tag], revalidate: 3600 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`[cms] fetch failed for "${path}" (tag: ${tag}):`, err instanceof Error ? err.message : err);
    return null;
  }

  if (!res.ok) {
    console.error(`[cms] non-OK response for "${path}" (tag: ${tag}): HTTP ${res.status}`);
    return null;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    console.error(`[cms] invalid JSON for "${path}" (tag: ${tag}):`, err instanceof Error ? err.message : err);
    return null;
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error(`[cms] response shape mismatch for "${path}" (tag: ${tag}):`, z.prettifyError(parsed.error));
    return null;
  }

  return parsed.data;
}

const campaignSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: nullableString(),
  description: z.string(),
  image: mediaSchema,
  category: z.string(),
  featured: z.boolean(),
  ctaLabel: nullableString(),
  ctaUrl: nullableString(),
});
export type CmsCampaign = z.infer<typeof campaignSchema>;

export async function getCampaigns(): Promise<CmsCampaign[] | null> {
  // RFP §3.1.3: a campaign should drop off the list once its own endDate
  // passes, without an editor having to remember to flip campaignStatus by
  // hand. Manual campaignStatus="expired" still works as an override; this
  // adds an automatic date-based expiry on top of it, evaluated fresh on
  // every fetch (no cron/job scheduler needed — the ISR/ revalidate window
  // already re-fetches this regularly).
  const now = new Date().toISOString();
  const query = [
    "depth=1",
    "limit=100",
    "sort=-createdAt",
    "where[and][0][campaignStatus][not_equals]=expired",
    "where[and][1][or][0][endDate][exists]=false",
    `where[and][1][or][1][endDate][greater_than_equal]=${encodeURIComponent(now)}`,
  ].join("&");
  const data = await cmsFetch(`/campaigns?${query}`, "campaigns", listResponseSchema(campaignSchema));
  return data?.docs ?? null;
}

/**
 * Payload's lexical richText field stores a nested JSON document, not plain
 * text. This is a minimal flattener (paragraph/heading/list-item text runs
 * joined per block) — enough to render campaign/blog detail bodies without
 * pulling in a full lexical-to-react renderer.
 */
export function richTextToParagraphs(node: unknown): string[] {
  const root = (node as { root?: { children?: unknown[] } } | null | undefined)?.root;
  if (!root?.children) return [];

  const extractText = (n: unknown): string => {
    if (!n || typeof n !== "object") return "";
    const obj = n as { text?: string; children?: unknown[] };
    if (typeof obj.text === "string") return obj.text;
    if (Array.isArray(obj.children)) return obj.children.map(extractText).join("");
    return "";
  };

  return root.children.map(extractText).map((t) => t.trim()).filter(Boolean);
}

const campaignDetailSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  image: mediaSchema,
  category: z.string(),
  body: z.unknown().nullable().optional(),
  terms: z.unknown().nullable().optional(),
  seoTitle: nullableString(),
  seoDescription: nullableString(),
  startDate: nullableString(),
  endDate: nullableString(),
});
export type CmsCampaignDetail = z.infer<typeof campaignDetailSchema>;

export async function getCampaignBySlug(slug: string): Promise<CmsCampaignDetail | null> {
  const data = await cmsFetch(
    `/campaigns?depth=1&limit=1&where[slug][equals]=${encodeURIComponent(slug)}`,
    "campaigns",
    listResponseSchema(campaignDetailSchema)
  );
  return data?.docs?.[0] ?? null;
}

export function campaignToCard(c: CmsCampaign) {
  return {
    title: c.title,
    description: c.description,
    image: c.image.url,
    imageAlt: c.image.alt || c.title,
    href: c.ctaUrl || (c.slug ? `/kampanyalar/${c.slug}` : "/kampanyalar"),
  };
}

const faqItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  question: z.string(),
  answer: z.string(),
  category: z.string(),
  order: z.number(),
});
export type CmsFaqItem = z.infer<typeof faqItemSchema>;

export async function getFaqItems(category?: string): Promise<CmsFaqItem[] | null> {
  const query = category ? `&where[category][equals]=${encodeURIComponent(category)}` : "";
  const data = await cmsFetch(
    `/faq-items?depth=0&limit=200&sort=order${query}`,
    "faq-items",
    listResponseSchema(faqItemSchema)
  );
  return data?.docs ?? null;
}

const blogPostSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
  coverImage: mediaSchema,
  excerpt: z.string(),
  category: nullableString(),
  publishedDate: nullableString(),
});
export type CmsBlogPost = z.infer<typeof blogPostSchema>;

export async function getBlogPosts(): Promise<CmsBlogPost[] | null> {
  const data = await cmsFetch(
    "/blog-posts?depth=1&limit=100&sort=-publishedDate&where[postStatus][not_equals]=archived",
    "blog-posts",
    listResponseSchema(blogPostSchema)
  );
  return data?.docs ?? null;
}

const blogPostDetailSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
  coverImage: mediaSchema,
  excerpt: z.string(),
  body: z.unknown().nullable().optional(),
  category: nullableString(),
  publishedDate: nullableString(),
  seoTitle: nullableString(),
  seoDescription: nullableString(),
});
export type CmsBlogPostDetail = z.infer<typeof blogPostDetailSchema>;

export async function getBlogPostBySlug(slug: string): Promise<CmsBlogPostDetail | null> {
  const data = await cmsFetch(
    `/blog-posts?depth=1&limit=1&where[slug][equals]=${encodeURIComponent(slug)}`,
    "blog-posts",
    listResponseSchema(blogPostDetailSchema)
  );
  return data?.docs?.[0] ?? null;
}

const feeRowSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  label: z.string(),
  value: z.string(),
  order: z.number(),
});
export type CmsFeeRow = z.infer<typeof feeRowSchema>;

export async function getFeeRows(): Promise<CmsFeeRow[] | null> {
  const data = await cmsFetch("/fee-rows?depth=0&limit=200&sort=order", "fee-rows", listResponseSchema(feeRowSchema));
  return data?.docs ?? null;
}

const limitTableSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  order: z.number(),
  rows: z.array(
    z.object({
      category: z.string(),
      period: z.string(),
      unverifiedLimit: z.string(),
      verifiedLimit: z.string(),
    })
  ),
});
export type CmsLimitTable = z.infer<typeof limitTableSchema>;

export async function getLimitTables(): Promise<CmsLimitTable[] | null> {
  const data = await cmsFetch(
    "/limit-tables?depth=0&limit=100&sort=order",
    "limit-tables",
    listResponseSchema(limitTableSchema)
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

const navLinkSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  label: z.string(),
  href: z.string(),
  section: z.custom<NavLinkSection>((v) => typeof v === "string"),
  order: z.number(),
});
export type CmsNavLink = z.infer<typeof navLinkSchema>;

export async function getNavLinks(): Promise<CmsNavLink[] | null> {
  const data = await cmsFetch("/nav-links?depth=0&limit=200&sort=order", "nav-links", listResponseSchema(navLinkSchema));
  return data?.docs ?? null;
}

export type ProductHeroPage =
  | "anasayfa"
  | "vodafone-pay-uygulama"
  | "vodafone-pay-kart"
  | "qr-ile-faturana-yansit"
  | "faturana-yansit"
  | "aninda-bakiye";

const productHeroSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  page: z.custom<ProductHeroPage>((v) => typeof v === "string"),
  image: mediaSchema,
  heading: z.string(),
});
export type CmsProductHero = z.infer<typeof productHeroSchema>;

export async function getProductHero(page: ProductHeroPage): Promise<CmsProductHero | null> {
  const data = await cmsFetch(
    `/product-heroes?depth=1&limit=1&where[page][equals]=${encodeURIComponent(page)}`,
    "product-heroes",
    listResponseSchema(productHeroSchema)
  );
  return data?.docs?.[0] ?? null;
}

const featureCardSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  page: z.string(),
  icon: mediaSchema,
  title: z.string(),
  text: z.string(),
  order: z.number(),
});
export type CmsFeatureCard = z.infer<typeof featureCardSchema>;

export async function getFeatureCards(page: string): Promise<CmsFeatureCard[] | null> {
  const data = await cmsFetch(
    `/feature-cards?depth=1&limit=50&sort=order&where[page][equals]=${encodeURIComponent(page)}`,
    "feature-cards",
    listResponseSchema(featureCardSchema)
  );
  return data?.docs ?? null;
}

const stepCardSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  page: z.string(),
  number: z.string(),
  text: z.string(),
  image: mediaSchema,
  order: z.number(),
});
export type CmsStepCard = z.infer<typeof stepCardSchema>;

export async function getStepCards(page: string): Promise<CmsStepCard[] | null> {
  const data = await cmsFetch(
    `/step-cards?depth=1&limit=50&sort=order&where[page][equals]=${encodeURIComponent(page)}`,
    "step-cards",
    listResponseSchema(stepCardSchema)
  );
  return data?.docs ?? null;
}

const announcementSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  body: z.string(),
  deeplink: nullableString(),
  order: z.number(),
});
export type CmsAnnouncement = z.infer<typeof announcementSchema>;

export async function getAnnouncements(): Promise<CmsAnnouncement[] | null> {
  const data = await cmsFetch(
    "/announcements?depth=0&limit=100&sort=order",
    "announcements",
    listResponseSchema(announcementSchema)
  );
  return data?.docs ?? null;
}

const contentBlockSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  page: z.string(),
  blockType: z.enum(["step", "slide", "video", "logo"]),
  title: nullableString(),
  text: nullableString(),
  image: mediaSchema.nullable().optional().transform((v) => v ?? undefined),
  youtubeId: nullableString(),
  linkUrl: nullableString(),
  order: z.number(),
});
export type CmsContentBlock = z.infer<typeof contentBlockSchema>;

export async function getContentBlocks(page: string): Promise<CmsContentBlock[] | null> {
  const data = await cmsFetch(
    `/content-blocks?depth=1&limit=50&sort=order&where[page][equals]=${encodeURIComponent(page)}`,
    "content-blocks",
    listResponseSchema(contentBlockSchema)
  );
  return data?.docs ?? null;
}

export type LegalPageSlug =
  | "gizlilik-ve-guvenlik-politikasi"
  | "cerez-politikasi"
  | "bilgi-guvenligi"
  | "sozlesmeler-ve-formlar"
  | "web-sitesi-hukum-ve-sartlari";

const legalDocumentSchema = z.object({
  label: z.string(),
  file: z.object({ url: z.string() }),
});

const legalPageSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  slug: z.custom<LegalPageSlug>((v) => typeof v === "string"),
  title: z.string(),
  intro: z.string(),
  documents: z.array(legalDocumentSchema).nullable().optional().transform((v) => v ?? []),
});
export type CmsLegalPage = z.infer<typeof legalPageSchema>;

export async function getLegalPage(slug: LegalPageSlug): Promise<CmsLegalPage | null> {
  const data = await cmsFetch(
    `/legal-pages?depth=1&limit=1&where[slug][equals]=${encodeURIComponent(slug)}`,
    "legal-pages",
    listResponseSchema(legalPageSchema)
  );
  return data?.docs?.[0] ?? null;
}

const contactInfoSchema = z.object({
  companyName: nullableStringDefault(""),
  tradeRegistryNo: nullableStringDefault(""),
  address: nullableStringDefault(""),
  phone: nullableStringDefault(""),
  kepAddress: nullableStringDefault(""),
  customerServiceText: nullableStringDefault(""),
  tcmbAddress: nullableStringDefault(""),
  tcmbPhone: nullableStringDefault(""),
  tcmbFax: nullableStringDefault(""),
  tcmbKep: nullableStringDefault(""),
  pressRelationsUrl: nullableString(),
});
export type CmsContactInfo = z.infer<typeof contactInfoSchema>;

export async function getContactInfo(): Promise<CmsContactInfo | null> {
  const data = await cmsFetch("/globals/contact-info", "contact-info", contactInfoSchema);
  // An unconfigured global still round-trips through Payload with empty
  // strings rather than a 404 — treat "no company name set" as "not set".
  return data?.companyName ? data : null;
}

const representativeSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  businessName: z.string(),
  repCode: nullableString(),
  activityDescription: nullableString(),
  phone: nullableString(),
  mersisNo: nullableString(),
  address: z.string(),
  province: z.string(),
  district: z.string(),
  authorizedPerson: nullableString(),
  qrCode: mediaSchema.nullable().optional().transform((v) => v ?? undefined),
});
export type CmsRepresentative = z.infer<typeof representativeSchema>;

export async function getRepresentatives(): Promise<CmsRepresentative[] | null> {
  const data = await cmsFetch(
    "/representatives?depth=1&limit=1000&sort=businessName",
    "representatives",
    listResponseSchema(representativeSchema)
  );
  return data?.docs ?? null;
}

export async function getRepresentativeById(id: string): Promise<CmsRepresentative | null> {
  return cmsFetch(`/representatives/${encodeURIComponent(id)}?depth=1`, "representatives", representativeSchema);
}

const cookieRowSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
  provider: z.string(),
  party: z.string(),
  category: z.string(),
  description: z.string(),
  duration: z.string(),
});
export type CmsCookieRow = z.infer<typeof cookieRowSchema>;

export async function getCookieRows(): Promise<CmsCookieRow[] | null> {
  const data = await cmsFetch("/cookie-rows?depth=0&limit=200", "cookie-rows", listResponseSchema(cookieRowSchema));
  return data?.docs ?? null;
}

const pageMetaSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  pageKey: z.string(),
  breadcrumbLabel: nullableString(),
  seoTitle: nullableString(),
  seoDescription: nullableString(),
  ogImage: mediaSchema.nullable().optional().transform((v) => v ?? undefined),
});
export type CmsPageMeta = z.infer<typeof pageMetaSchema>;

/**
 * RFP §3.2.3/§3.2.4/§3.2.6: breadcrumb label + SEO fields for a static page,
 * editable from the CMS without a deploy. Returns null (not an error) when
 * no PageMeta document exists yet for this pageKey — callers fall back to
 * their own hardcoded defaults, same pattern as every other getter here.
 */
export async function getPageMeta(pageKey: string): Promise<CmsPageMeta | null> {
  const data = await cmsFetch(
    `/page-meta?depth=1&limit=1&where[pageKey][equals]=${encodeURIComponent(pageKey)}`,
    "page-meta",
    listResponseSchema(pageMetaSchema)
  );
  return data?.docs?.[0] ?? null;
}

const heroBlockSchema = z.object({
  blockType: z.literal("hero"),
  id: z.string().optional(),
  heading: z.string(),
  subheading: nullableString(),
  image: mediaSchema,
  ctaLabel: nullableString(),
  ctaUrl: nullableString(),
});
const richTextBlockSchema = z.object({
  blockType: z.literal("richText"),
  id: z.string().optional(),
  heading: nullableString(),
  body: z.unknown(),
});
const faqListBlockSchema = z.object({
  blockType: z.literal("faqList"),
  id: z.string().optional(),
  heading: nullableString(),
  category: nullableString(),
});
const campaignGridBlockSchema = z.object({
  blockType: z.literal("campaignGrid"),
  id: z.string().optional(),
  heading: z.string(),
  category: nullableString(),
});
const videoBlockSchema = z.object({
  blockType: z.literal("video"),
  id: z.string().optional(),
  heading: nullableString(),
  youtubeId: z.string(),
});
const logoGridBlockSchema = z.object({
  blockType: z.literal("logoGrid"),
  id: z.string().optional(),
  heading: nullableString(),
  logos: z.array(z.object({ name: z.string(), logo: mediaSchema, linkUrl: nullableString() })),
});

const pageBlockSchema = z.discriminatedUnion("blockType", [
  heroBlockSchema,
  richTextBlockSchema,
  faqListBlockSchema,
  campaignGridBlockSchema,
  videoBlockSchema,
  logoGridBlockSchema,
]);
export type CmsPageBlock = z.infer<typeof pageBlockSchema>;

const pageSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
  layout: z.array(pageBlockSchema).nullable().optional().transform((v) => v ?? []),
  seoTitle: nullableString(),
  seoDescription: nullableString(),
  ogImage: mediaSchema.nullable().optional().transform((v) => v ?? undefined),
});
export type CmsPage = z.infer<typeof pageSchema>;

/**
 * RFP §3.3: pages an editor builds entirely from the CMS (block-based),
 * distinct from the ~20 hand-built routes under src/app. Consumed by
 * src/app/[...slug]/page.tsx as a catch-all — Next.js resolves any more
 * specific static route first, so this never shadows an existing page.
 */
export async function getPageBySlug(slug: string): Promise<CmsPage | null> {
  const data = await cmsFetch(
    `/pages?depth=2&limit=1&where[slug][equals]=${encodeURIComponent(slug)}`,
    "pages",
    listResponseSchema(pageSchema)
  );
  return data?.docs?.[0] ?? null;
}

export async function getPages(): Promise<CmsPage[] | null> {
  const data = await cmsFetch("/pages?depth=0&limit=200", "pages", listResponseSchema(pageSchema));
  return data?.docs ?? null;
}

export function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export type { CmsMedia };
