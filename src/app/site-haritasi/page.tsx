import type { Metadata } from "next";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { buildMetadata } from "@/lib/metadata";
import { getNavLinks, getPageMeta, type NavLinkSection } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/site-haritasi");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Site Haritası | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay web sitesindeki tüm sayfalara bu site haritasından ulaşabilirsiniz.",
    keywords: pageMeta?.seoKeywords || undefined,
    path: "/site-haritasi",
    image: pageMeta?.ogImage?.url,
  });
}

type Group = { title: string; links: { label: string; href: string }[] };

/** Same sections Header/Footer already read via getNavLinks() — reusing them here means
 * editing a nav link in the CMS keeps this page in sync instead of drifting from a separate copy. */
const SECTION_TO_GROUP_TITLE: Record<string, string> = {
  "header-products": "Ürünler",
  "header-main": "İçerikler",
  "footer-kurumsal": "Kurumsal",
  "footer-yasal": "Yasal",
};

/**
 * RFP feedback 5.0 (fallback masking audit) — KEPT DELIBERATELY.
 *
 * Checked against the live DB: the CMS collection behind this section has ZERO
 * rows, so unlike the FAQ/announcement/campaign fallbacks removed in this
 * round, this array is not dead code that only fires on an outage — it IS what
 * the site currently renders. Deleting it would blank a working section rather
 * than reveal a masked failure. Remove it in the same change that seeds the
 * collection; see the round report's "kalan fallback'ler" table.
 */
const fallbackGroups: Group[] = [
  {
    title: "Ürünler",
    links: [
      { label: "Vodafone Pay Uygulaması", href: "/vodafone-pay-uygulama" },
      { label: "Vodafone Pay Kart", href: "/vodafone-pay-kart" },
      { label: "Faturana Yansıt", href: "/faturana-yansit" },
      { label: "Faturana Yansıt QR", href: "/qr-ile-faturana-yansit" },
      { label: "Anında Bakiye", href: "/aninda-bakiye" },
    ],
  },
  {
    title: "İçerikler",
    links: [
      { label: "Tüm Kampanyalar", href: "/kampanyalar" },
      { label: "Blog", href: "/blog" },
      { label: "Ücretler ve Limitler", href: "/ucretler-ve-limitler" },
      { label: "Sıkça Sorulan Sorular", href: "/sikca-sorulan-sorular" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Temsilciliklerimiz", href: "/temsilciliklerimiz" },
      { label: "İletişim", href: "/iletisim" },
      { label: "Kurumsal Yönetim", href: "/kurumsal-yonetim" },
      { label: "Duyurular", href: "/duyurular" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Gizlilik ve Güvenlik Politikası", href: "/gizlilik-ve-guvenlik-politikasi" },
      { label: "Çerez Politikası", href: "/cerez-politikasi" },
      { label: "Bilgi Güvenliği", href: "/bilgi-guvenligi" },
      { label: "Sözleşmeler ve Formlar", href: "/sozlesmeler-ve-formlar" },
      { label: "Web Sitesi Kullanımı Hüküm ve Şartları", href: "/web-sitesi-hukum-ve-sartlari" },
      { label: "Faydalı Bilgiler", href: "/faydali-bilgiler" },
    ],
  },
];

export default async function SiteHaritasi() {
  const cmsNavLinks = await getNavLinks();

  const groups: Group[] = cmsNavLinks?.length
    ? (Object.keys(SECTION_TO_GROUP_TITLE) as NavLinkSection[])
        .map((section) => ({
          title: SECTION_TO_GROUP_TITLE[section],
          links: cmsNavLinks
            .filter((l) => l.section === section)
            .sort((a, b) => a.order - b.order)
            .map((l) => ({ label: l.label, href: l.href })),
        }))
        .filter((group) => group.links.length > 0)
    : fallbackGroups;

  const pageMeta = await getPageMeta("/site-haritasi");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Site Haritası"} />

      <section className="mx-auto w-full max-w-[1030px] px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black lg:text-left">Site Haritası</h1>

        <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-lg font-bold text-black">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-600 transition-colors hover:text-vf-red">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
