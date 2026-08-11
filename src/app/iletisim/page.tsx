import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getContactInfo } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Vodafone Pay İletişim | Müşteri Hizmetleri",
  description: "Vodafone Pay şirket bilgileri, müşteri hizmetleri ve denetim mercii iletişim bilgileri.",
};

const fallback = {
  companyName: "Vodafone Elektronik Para ve Ödeme A.Ş.",
  tradeRegistryNo: "605026-0",
  address: "Maslak Mahallesi Büyükdere Caddesi no:251 Sarıyer/ İstanbul",
  phone: "+90 212 367 00 00",
  kepAddress: "vodafoneelektronikpara@hs03.kep.tr",
  customerServiceText: "Müşteri Hizmetlerimize 0212 942 21 21 numarasını arayarak ulaşabilirsiniz.\nÇağrı merkezimiz 7 gün 08:00-02:00 arası hizmet vermektedir.",
  tcmbAddress: "İdare Merkezi\nHacı Bayram Mah. İstiklal Cad. No:10 06050 Ulus Altındağ Ankara",
  tcmbPhone: "(0312) 507 5000",
  tcmbFax: "(0312) 507 5640",
  tcmbKep: "merkezbankasi@hs02.kep.tr",
  pressRelationsUrl: "https://medyamerkezi.vodafone.com.tr/",
};

export default async function Iletisim() {
  const info = (await getContactInfo()) ?? fallback;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Şirket Unvanı", value: info.companyName },
    { label: "Ticaret Sicil No", value: info.tradeRegistryNo },
    { label: "Merkezinin Bulunduğu Yer", value: info.address },
    { label: "Vodafone Merkez Telefon Numarası", value: info.phone },
    { label: "Kep Adresi", value: info.kepAddress },
    {
      label: "Vodafone Pay Müşteri Hizmetleri",
      value: info.customerServiceText.split("\n").map((line, i) => (
        <span key={`${line}-${i}`}>
          {i > 0 && <br />}
          {line}
        </span>
      )),
    },
    {
      label: "Denetim Merci",
      value: (
        <>
          TÜRKİYE CUMHURİYET MERKEZ BANKASI
          <br />
          {info.tcmbAddress.split("\n").map((line, i) => (
            <span key={`${line}-${i}`}>
              {line}
              <br />
            </span>
          ))}
          Telefon: {info.tcmbPhone}
          <br />
          Faks: {info.tcmbFax}
          <br />
          Kayıtlı Elektronik Posta (KEP): {info.tcmbKep}
        </>
      ),
    },
    ...(info.pressRelationsUrl
      ? [
          {
            label: "Basın Bültenleri ve Medya İlişkileri",
            value: (
              <a
                href={info.pressRelationsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-vf-red underline"
              >
                {info.pressRelationsUrl.replace(/^https?:\/\//, "")}
              </a>
            ),
          },
        ]
      : []),
  ];

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current="İletişim" />

      <section className="w-full bg-gradient-to-r from-vf-navy to-vf-red px-4 py-16 lg:px-16">
        <div className="mx-auto max-w-[1030px]">
          <h1 className="text-[32px] font-bold text-white lg:text-[40px]">İletişim</h1>
        </div>
      </section>

      <section className="w-full bg-vf-gray px-4 py-12 lg:px-16">
        <div className="mx-auto max-w-[1030px] overflow-hidden rounded-lg bg-white shadow-md">
          <dl className="divide-y divide-gray-100">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-1 gap-y-1 p-6 sm:grid-cols-3 sm:gap-x-6">
                <dt className="text-sm font-bold text-black sm:col-span-1">{row.label}</dt>
                <dd className="text-sm text-gray-700 sm:col-span-2">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Footer />
    </main>
  );
}
