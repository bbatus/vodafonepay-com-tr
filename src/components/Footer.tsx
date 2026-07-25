import Image from "next/image";
import Link from "next/link";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Kurumsal",
    links: [
      { label: "Temsilciliklerimiz", href: "/temsilcilik" },
      { label: "İletişim", href: "/iletisim" },
      { label: "Kurumsal Yönetim", href: "/kurumsal-yonetim" },
      { label: "Duyurular", href: "/duyurular" },
      { label: "Bilgi Toplum Hizmetleri", href: "/bilgi-toplum-hizmetleri" },
    ],
  },
  {
    title: "Sık Sorulanlar",
    links: [
      { label: "QR ile Ödeme Nasıl Yapılır?", href: "/sikca-sorulan-sorular" },
      { label: "İstanbulkart Bakiye Yükleme", href: "/sikca-sorulan-sorular" },
      { label: "Anında Bakiye ile Market Harcaması", href: "/sikca-sorulan-sorular" },
      { label: "Vodafone Pay Kart'a Bakiye Yükleme", href: "/sikca-sorulan-sorular" },
      { label: "Cashback Nedir?", href: "/sikca-sorulan-sorular" },
      { label: "Ön Ödemeli Kart Nedir?", href: "/sikca-sorulan-sorular" },
    ],
  },
  {
    title: "Kampanyalar",
    links: [
      { label: "Eğlence Yanımda üyeliklerinde %50 indirim", href: "/kampanyalar" },
      { label: "Kolay Paket Yüklemelerine 100 TL Nakit İade", href: "/kampanyalar" },
      { label: "Kurum Faturalarını 100 TL Nakit İade", href: "/kampanyalar" },
      { label: "İlk QR Harcamanı Yap, %20 İndirim Kazan!", href: "/kampanyalar" },
      { label: "Netflix ve Spotify Üyelikleriniz 1 Ay Bedava", href: "/kampanyalar" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
      { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
      { label: "Çerez Politikası", href: "/cerez-politikasi" },
      { label: "Site Haritası", href: "/site-haritasi" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-black px-4 py-12 text-white lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">{col.title}</h4>
            <ul className="flex flex-col gap-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-gray-800 pt-6 sm:flex-row">
        <Image src="/images/vpay-logo.svg" alt="Vodafone Pay" width={100} height={30} className="brightness-0 invert" />
        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <Image src="/images/linkedin-light.svg" alt="LinkedIn" width={24} height={24} />
        </a>
        <Image src="/images/sticky-qr.png" alt="Vodafone Pay QR Kodu" width={100} height={130} className="rounded-lg" />
        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Vodafone Pay. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
