import type { Metadata } from "next";

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
