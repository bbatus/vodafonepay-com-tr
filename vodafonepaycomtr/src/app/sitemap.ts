import type { MetadataRoute } from "next";
import { getBlogPosts, getCampaigns, getPages, getRepresentatives } from "@/lib/cms";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

/**
 * Hand-written routes under src/app only. Anything that lives in the Pages
 * collection is picked up from the CMS below instead — listing it here too
 * emits the same <loc> twice.
 *
 * `/aninda-bakiye`, `/qr-ile-faturana-yansit` and `/vodafone-pay-uygulama`
 * used to be here and were removed when they were migrated onto Pages: the
 * duplicate was invisible until `getPages()` was fixed, because that getter
 * had been returning null and contributing nothing at all.
 */
const STATIC_ROUTES = [
  "",
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
  "/sikca-sorulan-sorular",
  "/site-haritasi",
  "/sozlesmeler-ve-formlar",
  "/temsilciliklerimiz",
  "/ucretler-ve-limitler",
  "/vodafone-pay-kart",
  "/web-sitesi-hukum-ve-sartlari",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [campaigns, blogPosts, representatives, pages] = await Promise.all([
    getCampaigns(),
    getBlogPosts(),
    getRepresentatives(),
    getPages(),
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

  const editorPageEntries: MetadataRoute.Sitemap = (pages ?? []).map((p) => ({
    url: `${SITE_URL}/${p.slug}`,
  }));

  const all = [...staticEntries, ...campaignEntries, ...blogEntries, ...representativeEntries, ...editorPageEntries];

  // Belt-and-braces: an editor is free to create a Page whose slug matches a
  // hand-written route, and a sitemap must not list the same URL twice.
  // First occurrence wins, so a static entry keeps its lastModified.
  return [...new Map(all.map((entry) => [entry.url, entry])).values()];
}
