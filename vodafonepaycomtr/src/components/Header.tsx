import { HeaderClient } from "@/components/HeaderClient";
import { getNavLinks, getProductsMenuPages } from "@/lib/cms";
import type { NavLink } from "@/types/homepage";

/**
 * RFP feedback 5.0 (fallback masking audit) — KEPT DELIBERATELY.
 *
 * NavLinks(header-products/header-main) and Pages(showInProductsMenu) are all
 * seeded and published now (29.08 migration), so this array is dead in normal
 * operation — same status as Footer's `fallbackColumns`. It stays for the same
 * reason: a safety net if that data ever comes back genuinely empty (an outage,
 * a bad migration), not padding for missing content.
 */
const fallbackProductLinks: NavLink[] = [
  { label: "Vodafone Pay Uygulaması", href: "/vodafone-pay-uygulama" },
  { label: "Vodafone Pay Kart", href: "/vodafone-pay-kart" },
  { label: "QR ile Faturana Yansıt", href: "/qr-ile-faturana-yansit" },
  { label: "Faturana Yansıt", href: "/faturana-yansit" },
  { label: "Anında Bakiye", href: "/aninda-bakiye" },
];

const fallbackNavLinks: NavLink[] = [
  { label: "Kampanyalar", href: "/kampanyalar" },
  { label: "Blog", href: "/blog" },
  { label: "Ücretler ve Limitler", href: "/ucretler-ve-limitler" },
  { label: "Sıkça Sorulan Sorular", href: "/sikca-sorulan-sorular" },
];

export async function Header() {
  const [cmsLinks, productPages] = await Promise.all([getNavLinks(), getProductsMenuPages()]);

  const toLink = (l: NonNullable<typeof cmsLinks>[number]): NavLink => ({ label: l.label, href: l.href, mobileHref: l.mobileHref });

  /**
   * The "Ürünler" dropdown has TWO sources, on purpose:
   *  - NavLinks(section=header-products) — the only way to point at a route
   *    that isn't a Pages document (/faturana-yansit, /vodafone-pay-kart)
   *    or at an external URL.
   *  - Pages(showInProductsMenu) — an editor-built page listing ITSELF, so
   *    nobody has to hand-copy its slug into a second collection.
   *
   * Both carry a 1-based position, so they're merged into one list and
   * sorted by it. A page with no explicit number sorts last (the CMS hook
   * normally assigns one, so this only covers rows written before the field
   * existed); ties keep NavLinks first, deterministically.
   */
  const orderedProducts: { link: NavLink; order: number; source: number }[] = [
    ...(cmsLinks ?? [])
      .filter((l) => l.section === "header-products")
      .map((l) => ({ link: toLink(l), order: l.order, source: 0 })),
    ...(productPages ?? []).map((p) => ({
      link: { label: p.productsMenuLabel || p.title, href: `/${p.slug}` },
      order: p.productsMenuOrder ?? Number.MAX_SAFE_INTEGER,
      source: 1,
    })),
  ];
  const productLinks = orderedProducts
    .sort((a, b) => a.order - b.order || a.source - b.source)
    .map((p) => p.link);

  const navLinks = cmsLinks?.length
    ? cmsLinks.filter((l) => l.section === "header-main").map(toLink)
    : fallbackNavLinks;

  return (
    <HeaderClient
      productLinks={productLinks.length ? productLinks : fallbackProductLinks}
      navLinks={navLinks.length ? navLinks : fallbackNavLinks}
    />
  );
}
