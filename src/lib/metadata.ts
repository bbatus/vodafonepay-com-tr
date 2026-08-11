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
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
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
