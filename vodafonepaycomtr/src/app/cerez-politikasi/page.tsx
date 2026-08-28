import type { Metadata } from "next";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getCookieRows, getLegalPage, getPageMeta } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";
import { RichText } from "@/components/RichText";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/cerez-politikasi");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Çerez Politikası | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay web sitesinde kullanılan çerezler, türleri ve yönetimi hakkında bilgi.",
    keywords: pageMeta?.seoKeywords || undefined,
    path: "/cerez-politikasi",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function CerezPolitikasi() {
  const [cmsPage, cmsCookieRows] = await Promise.all([getLegalPage("cerez-politikasi"), getCookieRows()]);
  // Follow-up 28.08: the 59-row hardcoded `./cookieRows` fallback this used to
  // fall back to is gone — the table was migrated into the `cookie-rows`
  // collection (through the real Growth Maker -> Checker flow) so it is
  // editable by a role instead of living in the bundle. Its own comment said
  // to remove it "in the same change that seeds the collection"; this is that
  // change. An empty CMS now renders the honest empty state rather than a
  // stale copy of the table.
  const cookieRows = cmsCookieRows ?? [];

  const pageMeta = await getPageMeta("/cerez-politikasi");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Çerez Politikası"} />

      <section className="mx-auto w-full max-w-4xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Çerez Politikası</h1>

        <div className="mt-10 flex flex-col gap-y-6 text-sm leading-6 text-gray-700">
          <div>
            <h2 className="text-xl font-bold text-black">Veri Sorumlusu Kimdir?</h2>
            {/* Follow-up 28.08: the hardcoded intro fallback is gone — this body
                was migrated into the `legal-pages` collection through the real
                Growth Maker -> Checker flow, so a role owns it now. */}
            <RichText data={cmsPage?.intro ?? null} className="mt-3 flex flex-col gap-y-3" />
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

        {cmsPage?.deeplink && (
          <Link href={cmsPage.deeplink} className="mt-8 inline-block text-sm font-bold text-vf-red hover:underline">
            İlgili bağlantı →
          </Link>
        )}
      </section>

      <Footer />
    </main>
  );
}
