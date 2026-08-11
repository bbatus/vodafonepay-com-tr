import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getContactInfo, getPageMeta } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Vodafone Pay Kurumsal Yönetim | Hakkımızda",
  description: "Vodafone Pay hakkında, vizyon, misyon, ortaklık yapısı ve yönetim kurulu bilgileri.",
  path: "/kurumsal-yonetim",
});

const missionItems = [
  "Vodafone ve Vodafone Grubu’nun yurtiçi ve yurtdışında geliştirmiş olduğu ticari tecrübesini en uygun şekilde değerlendirmek.",
  "Mobil finansal ödeme ve elektronik para ürünleri ile finansal katılımın artırılmasını sağlamak.",
  "Etkin ve sürdürülebilir bilgi güvenliği ve iş sürekliliği yapısını sağlamak.",
  "Sağlam iç kontrol süreç ve prosedürleri ile güçlü bir risk yönetimi yapılanması oluşturmak.",
  "Hissedarları ve müşterileri açısından sürekli yüksek değer yaratan ve sosyal sorumluluk sahibi bir marka oluşturmak.",
];

const fallbackContact = {
  companyName: "Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş.",
  address: "Maslak Mah. Büyükdere Cad. Büyükdere 251 No: 251 Sarıyer",
  tradeRegistryNo: "605026-0",
  phone: "0212 942 21 21",
  kepAddress: "vodafoneelektronikpara@hs03.kep.tr",
  tcmbAddress: "İdare Merkezi\nHacı Bayram Mah. İstiklal Cad. No:10 06050 Ulus Altındağ Ankara",
  tcmbPhone: "(0312) 507 5000",
  tcmbFax: "(0312) 507 5640",
};

/** These rows mix ContactInfo-sourced fields (company name/address/phone/KEP/registry no) with
 * registry data that has no equivalent in the ContactInfo global (founding date, capital, tax
 * office, mersis no) — the latter stay hardcoded here. */
function buildSicilBilgileri(contact: typeof fallbackContact): [string, string][] {
  return [
    ["Şirket Unvanı", contact.companyName],
    ["Merkez Adresi", contact.address],
    ["Kuruluş/Ticaret Siciline Tescil Tarihi", "22.01.2016"],
    ["Ödenmiş Sermaye", "6.000.000.-TL"],
    ["Ticaret Sicil No", contact.tradeRegistryNo],
    ["Vergi Dairesi/Numarası", "Maslak Vergi Dairesi / 9250391491"],
    ["Mersis Numarası", "0925039149100014"],
    ["Telefon", contact.phone],
    ["E-Mail Adresi", contact.kepAddress],
    ["İnternet Adresi", "www.vodafonepay.com.tr"],
  ];
}

const executives: { name: string; bio: string }[] = [
  {
    name: "Hana Jalel Milesi",
    bio: "Nisan 2022 itibarıyla Vodafone Türkiye Finanstan Sorumlu İcra Kurulu Başkan Yardımcılığı pozisyonuna getirilen Hana Jalel, Vodafone ailesine 2007 yılında katılmıştır. Vodafone Türkiye’de ve Vodafone Grubu bünyesinde Ticari Finans Direktörlüğü, Güney Avrupa Bölgesi Denetim Direktörlüğü ve Finansal Planlama ve Analiz Direktörlüğü gibi çeşitli roller üstlenmiştir. Telekomünikasyon sektöründe ve finans alanında 23 yılı aşkın deneyime sahip olan Jalel, kariyerine Alcatel-Lucent şirketinde başlamış ve finans alanında farklı rollerde görev almıştır. Bilkent Üniversitesi İşletme bölümünden mezun olan Jalel, aynı üniversitede Ekonomi yüksek lisansını tamamlamıştır.",
  },
  {
    name: "Selçuk Karaçay",
    bio: "Selçuk Karaçay, Vodafone ailesine 2006 yılında Hukuk Baş Müşaviri olarak katılmış ve Hukuk departmanının Grup Hukuk organizasyonu içerisinde yeniden yapılanmasını koordine ederek Vodafone Türkiye Hukuk Departmanı çatısı altında Kurumsal Güvenlik ve Hukuk fonksiyonlarının kuruluşunu gerçekleştirmiştir. 2023 yılına kadar Vodafone Türkiye Kurumsal Güvenlik ve Hukuk’tan sorumlu İcra Kurulu Başkan Yardımcısı görevini sürdürmüştür. Hali hazırda Vodafone Türkiye grup şirketlerinden Dijital Servisler şirketler topluluğunda yer alan şirketlerin Yönetim Kurulu Başkanı ve tüm diğer Vodafone Türkiye Şirketlerinin ise Yönetim Kurulu Başkan Yardımcısıdır. Aynı zamanda Vodafone Idea Limited Hindistan’ın Yönetim Kurulu Üyesi ve Red Haven Veri Merkezi A.Ş.’nin de Yönetim Kurulu Başkan Vekilidir. Hukuk alanında 40 yılı ve telekomünikasyon sektöründe ise 20 yılı aşan tecrübesi ile Sayın Karaçay, kariyeri boyunca pek çok banka ve farklı sektörlerdeki önemli firmalarda Hukuk Baş Müşaviri olarak görev almıştır. İstanbul Üniversitesi Hukuk Fakültesi mezunu olan Karaçay, çeşitli STK ve Ticari, Hukuki ve Entelektüel platformların aktif katılımcıdır.",
  },
  {
    name: "Engin Aksoy",
    bio: "Engin Aksoy, Vodafone Türkiye ailesine 2008 yılında katılmıştır. Çeşitli yöneticilik pozisyonları üstlenen Aksoy, 2012’de İcra Kurulu Üyesi olmuş, sırasıyla Kurumsal ve Bireysel İş Biriminden Sorumlu İcra Kurulu Başkan Yardımcısı olarak hizmet vermiştir. Aksoy, Şubat 2021’den bu yana Vodafone Türkiye CEO'su olarak görev yapmaktadır. Vodafone Türkiye’ye katılmadan önce, 2000-2006 yılları arasında Nike Türkiye’de İcra Kurulu Üyesi, 2006-2008 yılları arasında ise Nike B.V. EMEA bölge merkezinde Avrupa, Ortadoğu ve Afrika’dan Sorumlu Kategori Satış Direktörü olarak görev yapan Aksoy, kariyerine 1994 yılında Coca-Cola İçecek’te başlamıştır. Ardından, 1997-2000 yılları arasında Michelin Bölge Satış Müdürü olarak çalışmıştır. Aksoy, YASED (Uluslararası Yatırımcılar Derneği) Yönetim Kurulu Başkanı, M-TOD (Mobil Telekomünikasyon Operatörleri Derneği) ve Endeavour Türkiye, DEİK (Dış Ekonomik İlişkiler Kurulu) ve TÜSİAD (Türk Sanayicileri ve İşadamları Derneği) Yönetim Kurulu üyesidir. İstanbul Üniversitesi İngilizce İktisat bölümünden mezun olan Aksoy, Oxford Business Koleji’nden Pazarlama ve Singularity Üniversitesi’nden Exponential Growth programı diplomasına sahiptir.",
  },
  {
    name: "Zehra Sultan Meltem Şahin",
    bio: "Vodafone Türkiye ailesine 2017 yılında Kurumsal İş Biriminden Sorumlu İcra Kurulu Başkan Yardımcısı olarak katılan Meltem Bakiler Şahin, Şubat 2021’den bu yana Bireysel İş Biriminden Sorumlu İcra Kurulu Başkan Yardımcısı olarak görev yapmaktadır. Aynı zamanda Türkiye Vodafone Vakfı Yönetim Kurulu Başkan Yardımcısı’dır. Teknoloji sektöründe 20 yılı aşkın deneyimi bulunan Şahin, kariyerinin ilk yıllarında Sony Ericsson ve Procter & Gamble şirketlerinde çeşitli yerel ve global görevlerde bulunmuştur. Ardından Turkcell bünyesinde pazarlama ve müşteri deneyimi alanlarında farklı sorumluluklar üstlenen Şahin, daha sonra Millenicom şirketinde Genel Müdür ve Yönetim Kurulu Üyesi olarak görev yapmıştır. Şahin, Türkiye Eğitim Gönüllüleri Vakfı Yönetim Kurulu Üyesi olarak çalışmalarına devam etmektedir. Ege Üniversitesi Kimya Mühendisliği bölümünden mezun olan Şahin, yüksek lisansını Bilkent Üniversitesi İşletme bölümünde tamamlamıştır.",
  },
  {
    name: "Ceyhun Çakanel",
    bio: "Vodafone Türkiye ailesine 2011 yılında katılan Ceyhun Çakanel, Aralık 2025’ten bu yana Vodafone Elektronik Para ve Ödeme Hizmetleri AŞ’de Genel Müdür Yardımcısı olarak görev yapmakta ve genel müdürlük görevini vekaleten yürütmektedir. Finansal teknolojiler ve telekomünikasyon sektörlerinde 14 yılı aşkın deneyimi bulunan Çakanel, kariyeri boyunca büyüme stratejileri, kullanıcı kazanımı ve ticari yönetim alanlarında uzmanlaşmıştır. Daha önce Vodafone bünyesinde CRM, Ürün Yönetimi ve Pazarlama alanlarında çeşitli yöneticilik görevleri üstlenen Çakanel, İstanbul Teknik Üniversitesi Endüstri Mühendisliği bölümü mezunudur.",
  },
  {
    name: "Canan Yıldız",
    bio: "2006 yılında, Marmara Üniversitesi Ekonometri lisans bölümünden mezun oldu. 2021 yılında Arizona State University Global Business Leadership and Management micromaster programını tamamladı. 2005 yılında başladığı finans sektöründe; Garanti BBVA, QNB ve ING bankta İç Kontrol ve Uyum rollerinde görev aldı. 2021 yılından bu yana Vodafone Elektronik Para ve Ödeme Hizmetleri’nde çalışmakta olup bankacılık ve ödeme hizmetleri alanlarında 19 yıllık iş tecrübesi bulunmaktadır. Risk Yönetim ve İç Kontrol Birimi bünyesinde görev yapmaktadır.",
  },
];

const auditYears = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-vf-red text-xl font-bold text-white">
      {initial}
    </div>
  );
}

export default async function KurumsalYonetim() {
  const cmsContact = await getContactInfo();
  const contact = cmsContact
    ? {
        companyName: cmsContact.companyName || fallbackContact.companyName,
        address: cmsContact.address || fallbackContact.address,
        tradeRegistryNo: cmsContact.tradeRegistryNo || fallbackContact.tradeRegistryNo,
        phone: cmsContact.phone || fallbackContact.phone,
        kepAddress: cmsContact.kepAddress || fallbackContact.kepAddress,
        tcmbAddress: cmsContact.tcmbAddress || fallbackContact.tcmbAddress,
        tcmbPhone: cmsContact.tcmbPhone || fallbackContact.tcmbPhone,
        tcmbFax: cmsContact.tcmbFax || fallbackContact.tcmbFax,
      }
    : fallbackContact;
  const sicilBilgileri = buildSicilBilgileri(contact);
  const pageMeta = await getPageMeta("/kurumsal-yonetim");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Kurumsal Yönetim"} />

      <section className="mx-auto w-full max-w-[1030px] px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black lg:text-left">
          Kurumsal Yönetim
        </h1>

        <div className="mt-10 flex flex-col gap-y-10">
          <div>
            <h2 className="text-2xl font-bold text-black">Hakkımızda</h2>
            <p className="mt-4 text-sm leading-6 text-gray-700">
              Vodafone Grubu&apos;nun bünyesinde yer alan Vodafone Türkiye iştiraki olan Vodafone Elektronik Para ve
              Ödeme Hizmetleri A.Ş., 2015 yılında yenilikçi ürünleri ile Türkiye&apos;nin kapsamlı hizmet sağlayan
              elektronik para kuruluşu olma amacıyla kurulmuştur. VEPAŞ, 20.07.2017 tarihi itibariyle BDDK tarafından
              sağlanan e-para lisansına sahip bir elektronik para kuruluşu olarak faliyetlerini yürütmektedir.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Vizyon</h2>
            <p className="mt-4 text-sm leading-6 text-gray-700">
              Yenilikçi ürünleri ile Türkiye&apos;nin kapsamlı hizmet sağlayan elektronik para kuruluşu olmak.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Misyon</h2>
            <p className="mt-4 text-sm leading-6 text-gray-700">
              İnovatif çözümler ile müşterilerine ödeme hizmetleri ve elektronik para alanında farklılaşmış
              deneyimler sunmak.
            </p>
            <ul className="mt-4 flex flex-col gap-y-2">
              {missionItems.map((item) => (
                <li key={item} className="flex gap-x-2 text-sm leading-6 text-gray-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vf-red" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Ortaklık Yapısı</h2>
            <p className="mt-4 text-sm leading-6 text-gray-700">%100 Vodafone Telekomünikasyon A.Ş.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Sicil Bilgileri</h2>
            <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-md">
              <dl className="divide-y divide-gray-100">
                {sicilBilgileri.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-1 gap-y-1 p-5 sm:grid-cols-3 sm:gap-x-6">
                    <dt className="text-sm font-bold text-black sm:col-span-1">{label}</dt>
                    <dd className="text-sm text-gray-700 sm:col-span-2">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Yönetim Kurulu ve Üst Yönetim</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {executives.map((exec) => (
                <div key={exec.name} className="flex gap-x-4 rounded-lg bg-white p-5 shadow-md">
                  <Avatar name={exec.name} />
                  <div>
                    <h3 className="font-bold text-black">{exec.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{exec.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Bağımsız Denetçi Bilgileri ve Raporları</h2>
            <ul className="mt-4 flex flex-col gap-y-2">
              {auditYears.map((year) => (
                <li key={year} className="text-sm text-gray-700">
                  {year} Denetim Raporunu incelemek için tıklayınız. Faaliyet Raporunu incelemek için tıklayınız.
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Sicil Bilgileri / Denetim Mercii</h2>
            <div className="mt-4 rounded-lg bg-white p-6 shadow-md">
              <p className="text-sm leading-6 text-gray-700">
                TÜRKİYE CUMHURİYETİ MERKEZ BANKASI
                <br />
                {contact.tcmbAddress.split("\n").map((line, i) => (
                  <span key={`${line}-${i}`}>
                    {line}
                    <br />
                  </span>
                ))}
                Telefon: {contact.tcmbPhone}
                <br />
                Faks: {contact.tcmbFax}
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-700">
                Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş., 6493 sayılı yasa kapsamında BDDK tarafından
                yetkilendirilmiş, Ocak 2020&apos;den itibaren TCMB gözetiminde hizmet veren bir Elektronik Para ve
                Ödeme Hizmetleri kuruluşudur.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
