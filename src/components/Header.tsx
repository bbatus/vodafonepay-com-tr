import { HeaderClient } from "@/components/HeaderClient";
import { getNavLinks } from "@/lib/cms";
import type { NavLink } from "@/types/homepage";

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
