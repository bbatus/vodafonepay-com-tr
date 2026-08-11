import type { MetadataRoute } from "next";
import { getBlogPosts, getCampaigns, getRepresentatives } from "@/lib/cms";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

const STATIC_ROUTES = [
  "",
  "/aninda-bakiye",
  "/bilgi-guvenligi",
  "/blog",
  "/cerez-politikasi",
  "/duyurular",
  "/faturana-yansit",
  "/faydali-bilgiler",
  "/gizlilik-ve-guvenlik-politikasi",
  "/iletisim",
  "/kampanyalar",
  "/kurumsal-yonetim",
  "/qr-ile-faturana-yansit",
  "/sikca-sorulan-sorular",
  "/site-haritasi",
  "/sozlesmeler-ve-formlar",
  "/temsilciliklerimiz",
  "/ucretler-ve-limitler",
  "/vodafone-pay-kart",
  "/vodafone-pay-uygulama",
  "/web-sitesi-hukum-ve-sartlari",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [campaigns, blogPosts, representatives] = await Promise.all([
    getCampaigns(),
    getBlogPosts(),
    getRepresentatives(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const campaignEntries: MetadataRoute.Sitemap = (campaigns ?? [])
    .filter((c): c is typeof c & { slug: string } => Boolean(c.slug))
    .map((c) => ({ url: `${SITE_URL}/kampanyalar/${c.slug}` }));

  const blogEntries: MetadataRoute.Sitemap = (blogPosts ?? []).map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
  }));

  const representativeEntries: MetadataRoute.Sitemap = (representatives ?? []).map((r) => ({
    url: `${SITE_URL}/temsilci/${r.id}`,
  }));

  return [...staticEntries, ...campaignEntries, ...blogEntries, ...representativeEntries];
}
