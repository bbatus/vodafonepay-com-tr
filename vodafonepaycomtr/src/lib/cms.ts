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
/**
 * `preview` fetches draft content (RFP feedback 1.7) — authenticated via
 * `PREVIEW_SECRET` instead of a logged-in session (the site has none), and
 * never cached: draft content is by definition not the page's normal
 * public/publishable state, and Next's tag-based revalidation only ever
 * targets the published fetch.
 */
async function cmsFetch<T>(
  path: string,
  tag: string,
  schema: z.ZodType<T>,
  options?: { preview?: boolean }
): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${CMS_API_URL}${path}`, options?.preview
      ? {
          headers: { "x-preview-secret": process.env.PREVIEW_SECRET || "" },
          cache: "no-store",
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        }
      : {
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

/**
 * RFP feedback 1.3: category used to be a free-text value (Campaigns) or a
 * hardcoded select (FaqItems) on the doc itself — now every one of them is a
 * relationship to the shared Categories collection, populated via depth=1.
 */
const categoryRefSchema = z.object({ label: z.string(), slug: z.string() });

const categorySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  label: z.string(),
  slug: z.string(),
  scope: z.enum(["campaign", "blog", "faq"]),
  order: z.number(),
});
export type CmsCategory = z.infer<typeof categorySchema>;
export type CmsCategoryScope = CmsCategory["scope"];

/**
 * E2: FilterTabs.tsx reads this instead of a hardcoded label/slug list — a
 * category is add/rename-able from the CMS with no code change.
 *
 * `scope` is required, not optional — Categories is one shared collection
 * for two unrelated taxonomies (Campaigns/BlogPosts vs. FaqItems, see
 * cms/src/collections/Categories.ts), and the same slug legitimately exists
 * in both ("aninda-bakiye" is a real category in each). An unscoped fetch
 * mixed both into one tab list — confirmed live on /kampanyalar, which
 * showed FAQ-only categories ("Anasayfa") and a duplicate "Anında Bakiye"
 * tab in its filter bar. Every caller must say which taxonomy it wants.
 */
export async function getCategories(scope: CmsCategoryScope): Promise<CmsCategory[] | null> {
  const data = await cmsFetch(
    `/categories?depth=0&limit=100&sort=order&where[scope][equals]=${scope}`,
    "categories",
    listResponseSchema(categorySchema)
  );
  return data?.docs ?? null;
}

const translationSchema = z.object({ tr: z.string() });

/**
 * Reads a single row from the CMS's `translations` collection (normally an
 * admin-only microcopy store, see cms/src/collections/Translations.ts) —
 * used here for exactly one string: the "Tümü" filter-tab label shared by
 * /kampanyalar, /blog, and /sikca-sorulan-sorular (RFP follow-up: "Tümü"
 * used to be hardcoded three times over, couldn't be renamed, and (being
 * plain UI text, not a Category document) can't accidentally be deleted or
 * dragged out of first position the way a real Category could.
 * `fallback` is what renders if the row doesn't exist yet or the CMS is
 * unreachable — same DB-override-with-fallback shape as the admin's own
 * useDbStrings/loadDbStrings.
 */
export async function getTranslation(key: string, fallback: string): Promise<string> {
  const data = await cmsFetch(
    `/translations?depth=0&limit=1&where[key][equals]=${encodeURIComponent(key)}`,
    "translations",
    listResponseSchema(translationSchema)
  );
  return data?.docs?.[0]?.tr ?? fallback;
}

const campaignSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: nullableString(),
  description: z.string(),
  image: mediaSchema,
  category: categoryRefSchema.nullable(),
  featured: z.boolean(),
  ctaLabel: nullableString(),
  ctaUrl: nullableString(),
  // RFP feedback 5.3: the listing cards render "Kampanya Tarihi" now, so the
  // list query has to carry the dates the detail query already did.
  startDate: nullableString(),
  endDate: nullableString(),
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
 * RFP follow-up: the footer's "Kampanyalar" column used to be either a
 * hardcoded array or generic NavLinks rows — neither let an editor pick
 * WHICH campaign shows there. `showInFooter`/`footerOrder`
 * (cms/src/collections/Campaigns.ts) are the per-campaign switch; this reads
 * exactly what's flagged, already capped at 6 by the CMS side
 * (`FOOTER_ORDER_MAX`), sorted by that same field. Same cache tag as
 * `getCampaigns` — one campaign save already revalidates both.
 */
export async function getFooterCampaigns(): Promise<CmsCampaign[] | null> {
  const data = await cmsFetch(
    "/campaigns?depth=1&limit=6&sort=footerOrder&where[showInFooter][equals]=true",
    "campaigns",
    listResponseSchema(campaignSchema)
  );
  return data?.docs ?? null;
}

const campaignDetailSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  image: mediaSchema,
  category: categoryRefSchema.nullable(),
  body: z.unknown().nullable().optional(),
  terms: z.unknown().nullable().optional(),
  seoTitle: nullableString(),
  seoDescription: nullableString(),
  seoKeywords: nullableString(),
  startDate: nullableString(),
  endDate: nullableString(),
  ctaLabel: nullableString(),
  ctaUrl: nullableString(),
});
export type CmsCampaignDetail = z.infer<typeof campaignDetailSchema>;

export async function getCampaignBySlug(slug: string, options?: { preview?: boolean }): Promise<CmsCampaignDetail | null> {
  const draftParam = options?.preview ? "&draft=true" : "";
  const data = await cmsFetch(
    `/campaigns?depth=1&limit=1&where[slug][equals]=${encodeURIComponent(slug)}${draftParam}`,
    "campaigns",
    listResponseSchema(campaignDetailSchema),
    { preview: options?.preview }
  );
  return data?.docs?.[0] ?? null;
}

export function campaignToCard(c: CmsCampaign) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    image: c.image.url,
    imageAlt: c.image.alt || c.title,
    href: c.ctaUrl || (c.slug ? `/kampanyalar/${c.slug}` : "/kampanyalar"),
    linkLabel: c.ctaLabel,
    startDate: c.startDate,
    endDate: c.endDate,
  };
}

const faqItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  question: z.string(),
  answer: z.string(),
  // Was a hardcoded select value (a bare slug string); now the same
  // Categories relationship Campaigns/BlogPosts use. `.nullable()` even
  // though the CMS field is `required: true` — a category that gets deleted
  // out from under an already-saved FAQ falls back to null (FK ON DELETE
  // SET NULL) rather than the fetch breaking.
  category: categoryRefSchema.nullable(),
  order: z.number(),
  // RFP §3.1.7 follow-up: optional related-link field, shown below the
  // answer text in the shared Faq.tsx accordion — see FaqItems.ts.
  deeplink: nullableString(),
});
export type CmsFaqItem = z.infer<typeof faqItemSchema>;

/**
 * `category` is now a Categories slug (e.g. "aninda-bakiye"), not the old
 * hardcoded select value — same slugs, just sourced from the CMS instead of
 * baked into code. Payload resolves `where` on a populated relationship
 * subfield, so this filters server-side without fetching everything first.
 *
 * Always constrained to `category.scope = faq`, even when no slug is passed
 * — FaqItems.category is itself scope-restricted at the CMS level so this
 * can't currently return a campaign-scope category, but the same slug is
 * allowed to exist in both scopes (by design), so a bare slug filter alone
 * is one accidental future collision away from matching the wrong one.
 */
export async function getFaqItems(category?: string): Promise<CmsFaqItem[] | null> {
  const categoryQuery = category ? `&where[category.slug][equals]=${encodeURIComponent(category)}` : "";
  const data = await cmsFetch(
    `/faq-items?depth=1&limit=200&sort=order&where[category.scope][equals]=faq${categoryQuery}`,
    "faq-items",
    listResponseSchema(faqItemSchema)
  );
  return data?.docs ?? null;
}

/**
 * RFP follow-up: same pattern as `getFooterCampaigns` — the footer's "Sık
 * Sorulanlar" column is now driven by each FaqItem's own
 * `showInFooter`/`footerOrder` (cms/src/collections/FaqItems.ts), not a
 * hardcoded list. Independent of `category`/`showOnHomepage` — a question
 * can be footer-flagged regardless of which category or homepage state it's in.
 */
export async function getFooterFaqItems(): Promise<CmsFaqItem[] | null> {
  const data = await cmsFetch(
    "/faq-items?depth=1&limit=6&sort=footerOrder&where[showInFooter][equals]=true",
    "faq-items",
    listResponseSchema(faqItemSchema)
  );
  return data?.docs ?? null;
}

/**
 * Homepage FAQ block — an independent `showOnHomepage` flag (cms/src/
 * collections/FaqItems.ts), not the "Anasayfa" category. A question can
 * belong to any category (or none) and still show here; the "Anasayfa"
 * category remains its own separate /sikca-sorulan-sorular tab. Sorted by
 * `homepageOrder`, which the CMS scopes/auto-numbers independently of the
 * per-category `order` field — mixing questions from different categories
 * onto one page means their individual `order` values aren't comparable.
 */
export async function getHomepageFaqItems(): Promise<CmsFaqItem[] | null> {
  const data = await cmsFetch(
    "/faq-items?depth=1&limit=50&sort=homepageOrder&where[showOnHomepage][equals]=true",
    "faq-items",
    listResponseSchema(faqItemSchema)
  );
  return data?.docs ?? null;
}

/**
 * RFP follow-up: `BlogPosts.excerpt` (a separately-authored short summary)
 * was removed — a real post had the entire article pasted into it while
 * `body` sat empty, and even capped at 200 chars it was still a second
 * field an editor had to keep in sync with the real content. The live
 * site's own card teaser is just the article's own text, hard-truncated
 * with an ellipsis (confirmed against a vodafonepay.com.tr screenshot —
 * e.g. "...büyük şehirlerde gün...", cut mid-word, not word-wrapped), not a
 * separately-authored summary. This derives the same thing from `body`.
 */
export function richTextToPlainText(node: unknown, maxLength: number): string {
  const root = (node as { root?: { children?: unknown[] } } | null | undefined)?.root;
  if (!root?.children) return "";

  const extractText = (n: unknown): string => {
    if (!n || typeof n !== "object") return "";
    const obj = n as { text?: string; children?: unknown[] };
    if (typeof obj.text === "string") return obj.text;
    if (Array.isArray(obj.children)) return obj.children.map(extractText).join(" ");
    return "";
  };

  const full = root.children.map(extractText).map((t) => t.trim()).filter(Boolean).join(" ");
  if (full.length <= maxLength) return full;
  return `${full.slice(0, maxLength).trimEnd()}...`;
}

/**
 * RFP §3.2.5: LegalPages.intro moved from a plain textarea (paragraphs
 * split on blank lines, via `textToParagraphs`) to a real richText field so
 * editors get actual formatting on the two pages that render it as prose
 * (Çerez Politikası, Gizlilik ve Güvenlik Politikası — see their own
 * `<RichText data={cmsPage.intro} />` usage).
 *
 * Three OTHER legal pages (Sözleşmeler ve Formlar, Web Sitesi Hüküm ve
 * Şartları, Bilgi Güvenliği) don't use `intro` as prose at all — each line
 * is a distinct, separately-clickable item (a document/tip one-per-<li>),
 * matched by index in Sözleşmeler's case to the `documents` upload array.
 * That structure predates this change and still has to work, so this
 * extracts each top-level block's plain text as one array entry — same
 * shape `textToParagraphs` used to produce, sourced from richText instead
 * of a blank-line-delimited string.
 */
export function richTextToLines(node: unknown): string[] {
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

const blogPostSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
  coverImage: mediaSchema,
  body: z.unknown().nullable().optional(),
  ctaLabel: nullableString(),
  // Was free text; now the same Categories relationship Campaigns uses, so
  // /blog's filter tabs and the posts' own values finally index on the same
  // thing (matches how the live vodafonepay.com.tr blog filters).
  category: categoryRefSchema.nullable(),
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
  body: z.unknown().nullable().optional(),
  category: categoryRefSchema.nullable(),
  publishedDate: nullableString(),
  seoTitle: nullableString(),
  seoDescription: nullableString(),
  seoKeywords: nullableString(),
  // RFP §3.1.7 follow-up: optional related-link field, shown at the bottom
  // of the post's own detail page — see BlogPosts.ts's field comment.
  deeplink: nullableString(),
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

/**
 * "footer-sss"/"footer-kampanyalar" are no longer offered as NavLinks
 * options in the CMS (RFP follow-up — those two footer columns are now
 * driven by each Campaign/FaqItem's own `showInFooter` flag instead, see
 * `getFooterCampaigns`/`getFooterFaqItems`) but stay in this union because
 * Footer.tsx still tags its two locally-built columns with them for typing
 * consistency with `FooterColumn.section`.
 */
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
  // RFP §3.2.2: optional per-link override, only ever consumed by the
  // mobile nav drawer (HeaderClient.tsx) — undefined/empty means mobile
  // uses `href`, same as desktop.
  mobileHref: nullableString(),
  section: z.custom<NavLinkSection>((v) => typeof v === "string"),
  order: z.number(),
});
export type CmsNavLink = z.infer<typeof navLinkSchema>;

export async function getNavLinks(): Promise<CmsNavLink[] | null> {
  const data = await cmsFetch("/nav-links?depth=0&limit=200&sort=order", "nav-links", listResponseSchema(navLinkSchema));
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
  // Non-clickable text shown before the link, e.g. "Tüketici Hakları Bilgi
  // Formu için " — `label` is the clickable link text alone (e.g.
  // "tıklayınız"), not the whole sentence.
  prefix: nullableString(),
  label: z.string(),
  // Follow-up 25.08: a document row is now EITHER an uploaded PDF
  // (`source: "pdf"`, has `file`) or a page written in the CMS
  // (`source: "page"`, has `slug` + `body`, rendered at
  // /sozlesmeler-ve-formlar/{slug}). Both shapes are optional here so a row of
  // one kind doesn't fail parsing because it lacks the other kind's fields.
  source: z
    .enum(["pdf", "page"])
    .nullable()
    .optional()
    .transform((v) => v ?? "pdf"),
  // `mimeType` is what the belge/page.tsx viewer route uses to decide
  // between an embedded PDF viewer and an audio player — see that route's
  // doc comment for why a query param carries this rather than trusting the
  // file extension.
  file: z
    .object({ url: z.string(), mimeType: z.string().nullable().optional() })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  slug: nullableString(),
  body: z.unknown().nullable().optional(),
  enabled: z.boolean().nullable().optional().transform((v) => v ?? true),
});

const legalDocumentGroupSchema = z.object({
  label: z.string(),
  documents: z.array(legalDocumentSchema).nullable().optional().transform((v) => v ?? []),
});

const legalPageSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  slug: z.custom<LegalPageSlug>((v) => typeof v === "string"),
  title: z.string(),
  intro: z.unknown().nullable().optional(),
  heroImage: z
    .object({ url: z.string(), alt: z.string().nullable().optional() })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  groups: z.array(legalDocumentGroupSchema).nullable().optional().transform((v) => v ?? []),
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
  seoKeywords: nullableString(),
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
/** Added to close the gap found migrating the 5 hand-built product pages onto Pages — docs/RFP-OPEN-ITEMS.md §10. */
const iconCardsBlockSchema = z.object({
  blockType: z.literal("iconCards"),
  id: z.string().optional(),
  heading: nullableString(),
  description: nullableString(),
  cards: z.array(z.object({ icon: mediaSchema, title: z.string(), text: z.string() })),
});
const stepsBlockSchema = z.object({
  blockType: z.literal("steps"),
  id: z.string().optional(),
  heading: nullableString(),
  steps: z.array(z.object({ number: z.string(), text: z.string(), image: mediaSchema })),
});
/** Live parity: `widget_VpayApp_NasilKazanirim` — see Pages.ts's HowToEarnBlock. */
const howToEarnBlockSchema = z.object({
  blockType: z.literal("howToEarn"),
  id: z.string().optional(),
  heading: z.string(),
  image: mediaSchema,
  steps: z.array(z.object({ icon: mediaSchema, title: z.string(), description: z.string() })),
});
/** Live parity: `widget_WhereCanIBuy` / `widget_WhereCanIUse`. */
const imageWithTextBlockSchema = z.object({
  blockType: z.literal("imageWithText"),
  id: z.string().optional(),
  heading: z.string(),
  text: z.string(),
  image: mediaSchema,
  imageSide: z.enum(["left", "right"]).nullable().optional().transform((v) => v ?? "left"),
});
/** Live parity: `widget_PricesAndLimits` — data comes from the collections, not the block. */
const pricesAndLimitsBlockSchema = z.object({
  blockType: z.literal("pricesAndLimits"),
  id: z.string().optional(),
});
/** Live parity: `widget_Blogs` — the campaignGrid mirror for Blog Posts. */
const blogGridBlockSchema = z.object({
  blockType: z.literal("blogGrid"),
  id: z.string().optional(),
  heading: z.string(),
  category: nullableString(),
});
/** Live parity: `widget_Homepage_VpayAyricaliklarDunyasi`. */
const featureHighlightsBlockSchema = z.object({
  blockType: z.literal("featureHighlights"),
  id: z.string().optional(),
  heading: nullableString(),
  media: mediaSchema.nullable().optional().transform((v) => v ?? undefined),
  features: z.array(z.object({ icon: mediaSchema, title: z.string(), description: z.string() })),
});
/** Live parity: `widget_BoardOfDirectors`. */
const profileGridBlockSchema = z.object({
  blockType: z.literal("profileGrid"),
  id: z.string().optional(),
  heading: nullableString(),
  people: z.array(z.object({ photo: mediaSchema, name: z.string(), title: z.string() })),
});
/** Live parity: `widget_PhysicalCardUsed`. */
const mediaPanelBlockSchema = z.object({
  blockType: z.literal("mediaPanel"),
  id: z.string().optional(),
  heading: z.string(),
  text: nullableString(),
  backgroundImage: mediaSchema,
  youtubeId: nullableString(),
});
/** Live parity: `widget_FooterPages\ContactInfo` — data comes from the global. */
const contactInfoBlockSchema = z.object({
  blockType: z.literal("contactInfo"),
  id: z.string().optional(),
  heading: nullableString(),
});
/** Live parity: `widget_Representatives` — data comes from the collection. */
const representativesBlockSchema = z.object({
  blockType: z.literal("representatives"),
  id: z.string().optional(),
  heading: nullableString(),
  limit: z.number().nullable().optional().transform((v) => v ?? undefined),
});
/** Live parity: `widget_Homepage_VpayStepPhones`. */
const stepPhonesBlockSchema = z.object({
  blockType: z.literal("stepPhones"),
  id: z.string().optional(),
  heading: nullableString(),
  description: nullableString(),
  steps: z.array(z.object({ image: mediaSchema, title: z.string(), description: z.string() })),
});
const imageTextSlidesBlockSchema = z.object({
  blockType: z.literal("imageTextSlides"),
  id: z.string().optional(),
  heading: nullableString(),
  intro: nullableString(),
  sideImage: mediaSchema.nullable().optional().transform((v) => v ?? undefined),
  slides: z.array(z.object({ image: mediaSchema, text: z.string() })),
});
const videoListBlockSchema = z.object({
  blockType: z.literal("videoList"),
  id: z.string().optional(),
  heading: nullableString(),
  subheading: nullableString(),
  darkBackgroundImage: mediaSchema.nullable().optional().transform((v) => v ?? undefined),
  videos: z.array(z.object({ title: z.string(), youtubeId: z.string() })),
});
/** See Pages.ts's VideosWithTabsMarkerBlock/LeadFormCtaBlock comment — fields:[] by design. */
const videosWithTabsMarkerBlockSchema = z.object({
  blockType: z.literal("videosWithTabsMarker"),
  id: z.string().optional(),
});
const leadFormCtaBlockSchema = z.object({
  blockType: z.literal("leadFormCta"),
  id: z.string().optional(),
});

const pageBlockSchema = z.discriminatedUnion("blockType", [
  heroBlockSchema,
  richTextBlockSchema,
  faqListBlockSchema,
  campaignGridBlockSchema,
  videoBlockSchema,
  logoGridBlockSchema,
  iconCardsBlockSchema,
  stepsBlockSchema,
  howToEarnBlockSchema,
  imageWithTextBlockSchema,
  pricesAndLimitsBlockSchema,
  blogGridBlockSchema,
  featureHighlightsBlockSchema,
  profileGridBlockSchema,
  mediaPanelBlockSchema,
  contactInfoBlockSchema,
  representativesBlockSchema,
  stepPhonesBlockSchema,
  imageTextSlidesBlockSchema,
  videoListBlockSchema,
  videosWithTabsMarkerBlockSchema,
  leadFormCtaBlockSchema,
]);
export type CmsPageBlock = z.infer<typeof pageBlockSchema>;

/**
 * Butterfly-parity gap-fill (docs/PAGE-CREATE-PRODUCTION.MD analysis,
 * docs/RFP-OPEN-ITEMS.md §8): a simple parent reference for a breadcrumb
 * trail — deliberately not full nested routing, the URL stays flat /{slug}.
 */
const pageParentSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
});

const pageSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
  layout: z.array(pageBlockSchema).nullable().optional().transform((v) => v ?? []),
  seoTitle: nullableString(),
  seoDescription: nullableString(),
  seoKeywords: nullableString(),
  ogImage: mediaSchema.nullable().optional().transform((v) => v ?? undefined),
  parent: pageParentSchema.nullable().optional().transform((v) => v ?? undefined),
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

/**
 * Route listing only — `generateStaticParams` and the sitemap need nothing
 * but the slug, so this deliberately does NOT reuse `pageSchema`.
 *
 * It used to, and that was a real bug: `pageSchema` carries the `layout`
 * block union, whose image fields are `mediaSchema` OBJECTS — but this
 * request uses `depth=0`, where Payload returns an upload relation as a bare
 * numeric id. So the moment any page contained an image-bearing block, the
 * whole list failed validation and this returned null, which silently
 * dropped every editor-built page out of the sitemap and pre-rendered none
 * of them. Caught live in the app container's own fail-loud log:
 *   [cms] response shape mismatch for "/pages?depth=0&limit=200" (tag: pages):
 *   Invalid input: expected object, received number
 *
 * Asking only for the fields the callers actually read makes `depth=0`
 * correct by construction instead of a latent trap. Private pages are
 * already excluded server-side by the collection's `pagesRead` access.
 */
const pageRouteSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
});
export type CmsPageRoute = z.infer<typeof pageRouteSchema>;

export async function getPages(): Promise<CmsPageRoute[] | null> {
  const data = await cmsFetch("/pages?depth=0&limit=200", "pages", listResponseSchema(pageRouteSchema));
  return data?.docs ?? null;
}

/**
 * RFP follow-up: a Page can now put ITSELF in the header's "Ürünler"
 * dropdown via its own `showInProductsMenu` checkbox, instead of the editor
 * having to hand-write a matching NavLinks record (and get the slug right).
 *
 * Deliberately its own tiny schema rather than reusing `pageSchema`: the
 * menu only needs four scalar fields, and `pageSchema` would drag the whole
 * `layout` block union into a request that renders on every single page of
 * the site. That also makes this immune to the `depth=0` media problem that
 * makes `getPages()` fail validation for pages containing image blocks —
 * no media is fetched here at all.
 *
 * `visibility` is filtered server-side so a private page never reaches the
 * menu; unpublished ones are already excluded by Payload's own draft access.
 */
const productsMenuPageSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  slug: z.string(),
  productsMenuLabel: nullableString(),
  productsMenuOrder: z.number().nullable().optional().transform((v) => v ?? undefined),
});
export type CmsProductsMenuPage = z.infer<typeof productsMenuPageSchema>;

export async function getProductsMenuPages(): Promise<CmsProductsMenuPage[] | null> {
  const data = await cmsFetch(
    "/pages?depth=0&limit=100&sort=productsMenuOrder&where[showInProductsMenu][equals]=true&where[visibility][equals]=public",
    "pages",
    listResponseSchema(productsMenuPageSchema)
  );
  return data?.docs ?? null;
}

export function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export type { CmsMedia };
