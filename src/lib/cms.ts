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
