import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FaydaliBilgilerAccordion } from "./FaydaliBilgilerAccordion";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Faydalı Bilgiler | Vodafone Pay",
  description: "Vodafone Pay kullanımına dair faydalı bilgiler.",
  path: "/faydali-bilgiler",
});

export default function FaydaliBilgiler() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current="Faydalı Bilgiler" />

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
