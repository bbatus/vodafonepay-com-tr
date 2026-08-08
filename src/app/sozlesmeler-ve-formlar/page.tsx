import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, textToParagraphs } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Sözleşmeler ve Formlar | Vodafone Pay",
  description: "Vodafone Pay sözleşme, form ve ticari koşullar belgelerine buradan ulaşabilirsiniz.",
};

const fallbackDocuments = [
  "Tüketici Hakları Bilgi Formu için tıklayınız",
  "18.08.2026 tarihine kadar geçerli Ödeme Hizmetleri Çerçeve Kullanıcı Sözleşmesi için tıklayınız.",
  "18.08.2026 tarihi itibarı ile geçerli Ödeme Hizmetleri Çerçeve Kullanıcı Sözleşmesi için tıklayınız.",
  "Ticari Koşullar için tıklayınız.",
];

export default async function SozlesmelerVeFormlar() {
  const cmsPage = await getLegalPage("sozlesmeler-ve-formlar");
  const documents = cmsPage ? textToParagraphs(cmsPage.intro) : fallbackDocuments;

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current="Sözleşmeler ve Formlar" />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Sözleşmeler ve Formlar</h1>

        <ul className="mt-10 flex flex-col gap-y-3">
          {documents.map((doc, i) => (
            <li key={i}>
              <a
                href="#"
                className="flex items-center justify-between rounded bg-white px-5 py-4 text-sm font-bold text-vf-red shadow-[0px_2px_8px_0px_#00000029] transition-colors hover:text-red-700"
              >
                {doc}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
