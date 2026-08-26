import type { Metadata } from "next";
import { getPageMeta } from "@/lib/cms";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const DEFAULT_OG_IMAGE = "/images/hero-spotlight.jpg";

/**
 * Every page.tsx only had { title, description } — no canonical URL, no
 * OpenGraph/Twitter card, so links shared on social/chat apps rendered with
 * no preview. This fills in canonical + openGraph + twitter from the same
 * title/description every page already provides, keyed by the page's path.
 */
export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  /**
   * RFP §3.2.6 ("meta tags: title/description/keywords"). Google's stopped
   * using this tag for ranking since 2009 — this exists because the RFP
   * literally asks for it, not because it does anything for SEO. Comma-split
   * into an array since that's the format Next's Metadata API/most crawlers
   * that still read it expect; a blank/undefined value omits the tag
   * entirely rather than rendering an empty `content=""`.
   */
  keywords?: string | null;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const keywordList = keywords
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return {
    title,
    description,
    ...(keywordList?.length ? { keywords: keywordList } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Vodafone Pay",
      locale: "tr_TR",
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Follow-up 25.08 (SonarQube duplication audit): every page's own
 * `generateMetadata` was the same 6 lines — fetch `getPageMeta(path)`,
 * fall back to hardcoded copy per field, call `buildMetadata`. Pulled into
 * one helper; each page still owns its own hardcoded defaults (the actual
 * page-specific content), just not the fetch-then-fallback wiring around it.
 */
export async function buildPageMetadata(
  path: string,
  defaults: { title: string; description: string; keywords?: string }
): Promise<Metadata> {
  const pageMeta = await getPageMeta(path);
  return buildMetadata({
    title: pageMeta?.seoTitle || defaults.title,
    description: pageMeta?.seoDescription || defaults.description,
    keywords: pageMeta?.seoKeywords || defaults.keywords,
    path,
    image: pageMeta?.ogImage?.url,
  });
}
