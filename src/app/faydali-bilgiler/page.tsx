import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FaydaliBilgilerAccordion } from "./FaydaliBilgilerAccordion";
import { buildMetadata } from "@/lib/metadata";
import { getPageMeta } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/faydali-bilgiler");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Faydalı Bilgiler | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay kullanımına dair faydalı bilgiler.",
    keywords: pageMeta?.seoKeywords || undefined,
    path: "/faydali-bilgiler",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function FaydaliBilgiler() {
  const pageMeta = await getPageMeta("/faydali-bilgiler");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Faydalı Bilgiler"} />

      <section className="mx-auto w-full max-w-[1030px] px-4">
        <div className="flex items-center justify-between overflow-hidden rounded-lg bg-gradient-to-r from-black to-vf-red px-8 py-16">
          <h1 className="text-[32px] font-bold text-white lg:text-[40px]">Faydalı Bilgiler</h1>
          <div className="hidden h-[160px] w-[160px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-vf-red to-red-800 shadow-lg sm:flex">
            <span className="text-3xl font-bold text-white">Pay</span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1030px] px-4 py-12">
        <FaydaliBilgilerAccordion />
      </section>

      <Footer />
    </main>
  );
}
