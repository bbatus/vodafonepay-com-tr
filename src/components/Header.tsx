import { HeaderClient } from "@/components/HeaderClient";
import { getNavLinks } from "@/lib/cms";
import type { NavLink } from "@/types/homepage";

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
  const cmsLinks = await getNavLinks();

  const toLink = (l: NonNullable<typeof cmsLinks>[number]): NavLink => ({ label: l.label, href: l.href });

  const productLinks = cmsLinks?.length
    ? cmsLinks.filter((l) => l.section === "header-products").map(toLink)
    : fallbackProductLinks;
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
