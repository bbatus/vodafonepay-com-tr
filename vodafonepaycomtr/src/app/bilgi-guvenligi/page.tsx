import type { Metadata } from "next";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, getPageMeta, richTextToLines } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/bilgi-guvenligi");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Bilgi Güvenliği | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay müşteri bilgileri ve hassas ödeme verilerinin güvenliği için alınması gereken önlemler.",
    keywords: pageMeta?.seoKeywords || undefined,
    path: "/bilgi-guvenligi",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function BilgiGuvenligi() {
  const cmsPage = await getLegalPage("bilgi-guvenligi");
  // Follow-up 28.08: the hardcoded fallback this used to fall back to is
  // gone — the body was migrated into the `legal-pages` collection (through
  // the real Growth Maker -> Checker flow), so a role owns it now. Its own
  // comment said to remove the array "in the same change that seeds the
  // collection"; this is that change.
  const tips = richTextToLines(cmsPage?.intro ?? null);

  const pageMeta = await getPageMeta("/bilgi-guvenligi");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Bilgi Güvenliği"} />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Bilgi Güvenliği</h1>

        <p className="mt-8 text-sm leading-6 text-gray-700">
          Müşteri bilgilerinin, kişisel verilerin ve hassas ödeme verilerinin gizliliğini ve güvenliğini sağlamak
          üzere sunduğumuz hizmetlere ilişkin riskler ve alınması gereken önlemler aşağıdaki gibidir:
        </p>

        <ul className="mt-6 flex flex-col gap-y-4">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-x-3 text-sm leading-6 text-gray-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vf-red" />
              {tip}
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
