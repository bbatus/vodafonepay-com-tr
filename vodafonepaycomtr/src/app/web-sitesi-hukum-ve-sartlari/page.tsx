import type { Metadata } from "next";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, getPageMeta, richTextToLines } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/web-sitesi-hukum-ve-sartlari");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Web Sitesi Kullanımı Hüküm ve Şartları | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay web sitesinin kullanımına ilişkin hüküm ve şartlar.",
    keywords: pageMeta?.seoKeywords || undefined,
    path: "/web-sitesi-hukum-ve-sartlari",
    image: pageMeta?.ogImage?.url,
  });
}

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
const fallbackDocuments = ["Hüküm ve Şartlar için tıklayınız"];

export default async function WebSitesiHukumVeSartlari() {
  const cmsPage = await getLegalPage("web-sitesi-hukum-ve-sartlari");
  const documents = cmsPage ? richTextToLines(cmsPage.intro) : fallbackDocuments;

  const pageMeta = await getPageMeta("/web-sitesi-hukum-ve-sartlari");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
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
