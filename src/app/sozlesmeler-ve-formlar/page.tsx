import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, getPageMeta, textToParagraphs } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Sözleşmeler ve Formlar | Vodafone Pay",
  description: "Vodafone Pay sözleşme, form ve ticari koşullar belgelerine buradan ulaşabilirsiniz.",
  path: "/sozlesmeler-ve-formlar",
});

const fallbackDocuments = [
  "Tüketici Hakları Bilgi Formu için tıklayınız",
  "18.08.2026 tarihine kadar geçerli Ödeme Hizmetleri Çerçeve Kullanıcı Sözleşmesi için tıklayınız.",
  "18.08.2026 tarihi itibarı ile geçerli Ödeme Hizmetleri Çerçeve Kullanıcı Sözleşmesi için tıklayınız.",
  "Ticari Koşullar için tıklayınız.",
];

export default async function SozlesmelerVeFormlar() {
  const cmsPage = await getLegalPage("sozlesmeler-ve-formlar");
  const documents = cmsPage ? textToParagraphs(cmsPage.intro) : fallbackDocuments;
  const downloads = cmsPage?.documents ?? [];
  const pageMeta = await getPageMeta("/sozlesmeler-ve-formlar");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Sözleşmeler ve Formlar"} />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Sözleşmeler ve Formlar</h1>

        <ul className="mt-10 flex flex-col gap-y-3">
          {documents.map((doc, i) => {
            const download = downloads[i];
            const itemClassName =
              "flex w-full items-center justify-between rounded bg-white px-5 py-4 text-left text-sm font-bold text-vf-red shadow-[0px_2px_8px_0px_#00000029] transition-colors hover:text-red-700";
            return (
              <li key={doc}>
                {download ? (
                  <a href={download.file.url} target="_blank" rel="noopener noreferrer" download className={itemClassName}>
                    {doc}
                  </a>
                ) : (
                  <button type="button" className={itemClassName}>
                    {doc}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
