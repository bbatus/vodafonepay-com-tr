import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { cookieRows } from "./cookieRows";
import { getLegalPage, textToParagraphs } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Çerez Politikası | Vodafone Pay",
  description: "Vodafone Pay web sitesinde kullanılan çerezler, türleri ve yönetimi hakkında bilgi.",
};

const fallbackIntro = [
  "Vodafone'da kişisel verileriniz güvence altındadır. Bu çerçevede Vodafone, kişisel verilerinizi tüm teknik ve idari tedbirleri alarak korur. Gerekli güvenlik düzeyi için bütün teknolojik imkanlar kullanılır.",
  "Vodafone Elektronik Para ve Ödeme Hizmetleri AŞ (\"Vodafone\") ve tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu ('KVKK') ve ilgili mevzuat kapsamında Veri Sorumlusu sıfatıyla, kişisel verileriniz, yalnızca aşağıda açıklanan çerçevede ve ilgili mevzuata uygun olarak işlenebilecektir.",
  "Bu metin, https://www.vodafonepay.com.tr/ (\"Site\") kullanımınız veya ziyaretiniz sırasında sizlerin deneyimini geliştirmek için kullanılan çerezlerin cihazınıza yerleştirilmesi aracılığıyla otomatik yolla elde edilen kişisel verilerin işlenmesi hakkında sizleri bilgilendirmek amacıyla hazırlanmıştır.",
];

export default async function CerezPolitikasi() {
  const cmsPage = await getLegalPage("cerez-politikasi");
  const intro = cmsPage ? textToParagraphs(cmsPage.intro) : fallbackIntro;

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current="Çerez Politikası" />

      <section className="mx-auto w-full max-w-4xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Çerez Politikası</h1>

        <div className="mt-10 flex flex-col gap-y-6 text-sm leading-6 text-gray-700">
          <div>
            <h2 className="text-xl font-bold text-black">Veri Sorumlusu Kimdir?</h2>
            {intro.map((p) => (
              <p key={p} className="mt-3">
                {p}
              </p>
            ))}
          </div>

          <div>
            <h2 className="text-xl font-bold text-black">Çerezler Nedir ve Ne İşe Yararlar?</h2>
            <p className="mt-3">
              Çerezler, bir internet sitesini ziyaret ettiğiniz zaman oluşturulan ve cihazınıza kaydedilen küçük
              dosyalardır. Ziyaret ettiğiniz internet sitesindeki gezinme bilgilerinizi kaydederek çevrimiçi
              deneyiminizi daha kolay hale getirme amacıyla kullanılırlar. Çerezler sayesinde internet siteleri
              oturumunuzu açık tutabilir, kullanım tercihlerinizi hatırlayabilir veya size uygun içerikler
              sunabilir.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-black">Çerez Çeşitleri, Kullanım Amaçları ve Hukuki Sebepleri</h2>
            <p className="mt-3">
              Çerezler aracılığıyla toplanan kişisel verilerinizi, Kanun&apos;un 5. Maddesinde belirtilen kişisel
              veri işleme şartları ve aşağıda her bir çerez türü özelinde belirtilen amaçlar dahilinde işliyoruz.
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-y-2 pl-5">
              <li>
                <span className="font-bold text-black">Zorunlu Çerezler:</span> Bu kategorideki çerezler,
                Site&apos;nin doğru şekilde çalışması ve kullanılabilmesi için gereklidir.
              </li>
              <li>
                <span className="font-bold text-black">Performans (Analitik) Çerezleri:</span> Kullanıcıların
                internet sitesini nasıl kullandıkları hakkında bilgi toplayan çerezlerdir.
              </li>
              <li>
                <span className="font-bold text-black">İşlevsel Çerezler:</span> Bu kategorideki çerezler, internet
                sitesindeki kullanım tercihlerinizi hatırlamak ve site kullanımınızı kişiselleştirmek amacıyla
                kullanılan çerezlerdir.
              </li>
              <li>
                <span className="font-bold text-black">Reklam/Pazarlama Çerezleri:</span> Bu kategoride yer alan
                çerezler, kullanıcıların ilgi alanlarına göre kişiselleştirilmiş içerik sunmak ve pazarlama
                faaliyetlerinin etkinliğini ölçmek için kullanılır.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-black">Çerezleri Nasıl Yönetebilirsiniz?</h2>
            <p className="mt-3">
              Çerez ayarlarınızı tarayıcınız üzerinden açıp kapatabilirsiniz. Site&apos;ye ait çerezleri kapatmak
              veya kullanımını sınırlandırmak için, kullandığınız tarayıcı ayarları üzerinden gerekli değişiklikleri
              yapabilirsiniz. Tarayıcınızda çerez ayarlarınızı değiştirirseniz bizimle olan deneyiminiz
              takip edilmeyecektir.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-black">İnternet Sitesinde Kullanılan Çerezler Nelerdir?</h2>
            <p className="mt-3">
              Aşağıda yer alan tabloda Site&apos;de kullanılan çerezlere, bu çerezlerin sağlayıcısına, kullanım
              amacına ve kullanım süresine yer verilmiştir.
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-md">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead>
                  <tr className="bg-vf-gray text-black">
                    <th className="p-3 font-bold">Çerez Adı</th>
                    <th className="p-3 font-bold">Sağlayıcı</th>
                    <th className="p-3 font-bold">Kategori</th>
                    <th className="p-3 font-bold">Açıklama</th>
                    <th className="p-3 font-bold">Süre</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieRows.map((row, i) => (
                    <tr key={`${row.name}-${i}`} className="border-t border-gray-100 align-top">
                      <td className="p-3 font-mono text-[11px] text-black">{row.name}</td>
                      <td className="p-3 text-gray-600">
                        {row.provider}
                        <br />
                        <span className="text-gray-400">({row.party})</span>
                      </td>
                      <td className="p-3 text-gray-600">{row.category}</td>
                      <td className="p-3 text-gray-600">{row.description}</td>
                      <td className="p-3 text-gray-600">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400">Mevcut Versiyon Tarihi: 27/03/2024</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
