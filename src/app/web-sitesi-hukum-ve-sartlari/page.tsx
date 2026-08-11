import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, getPageMeta, textToParagraphs } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Web Sitesi Kullanımı Hüküm ve Şartları | Vodafone Pay",
  description: "Vodafone Pay web sitesinin kullanımına ilişkin hüküm ve şartlar.",
  path: "/web-sitesi-hukum-ve-sartlari",
});

const fallbackDocuments = ["Hüküm ve Şartlar için tıklayınız"];

export default async function WebSitesiHukumVeSartlari() {
  const cmsPage = await getLegalPage("web-sitesi-hukum-ve-sartlari");
  const documents = cmsPage ? textToParagraphs(cmsPage.intro) : fallbackDocuments;

  const pageMeta = await getPageMeta("/web-sitesi-hukum-ve-sartlari");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Web Sitesi Kullanımı Hüküm ve Şartları"} />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Hüküm ve Şartlar</h1>

        <ul className="mt-10 flex flex-col gap-y-3">
          {documents.map((doc) => (
            <li key={doc}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded bg-white px-5 py-4 text-left text-sm font-bold text-vf-red shadow-[0px_2px_8px_0px_#00000029] transition-colors hover:text-red-700"
              >
                {doc}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
