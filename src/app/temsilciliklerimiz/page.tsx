import type { Metadata } from "next";
import Image from "next/image";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { TemsilciliklerimizForm } from "./TemsilciliklerimizForm";

export const metadata: Metadata = {
  title: "En Yakın Temsilciliklerimiz | Vodafone Pay",
  description: "İl ve ilçe seçerek size en yakın Vodafone Pay temsilciliğini bulun.",
};

export default function Temsilciliklerimiz() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current="Temsilciliklerimiz" />

      <section className="mx-auto w-full max-w-[1030px] px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Temsilciliklerimiz</h1>

        <div className="mt-10">
          <TemsilciliklerimizForm />
        </div>

        <div className="mx-auto mt-12 flex w-full max-w-[560px] items-center justify-between gap-x-4 rounded-lg bg-vf-gray p-6">
          <div>
            <p className="text-sm font-bold text-black">Vodafone Pay uygulamasını indir</p>
            <p className="mt-1 text-xs text-gray-600">
              QR kodu okutarak Vodafone Pay uygulamasını hemen indirebilirsiniz.
            </p>
          </div>
          <Image
            src="/images/sticky-qr.png"
            alt="Vodafone Pay QR Kodu"
            width={100}
            height={130}
            className="h-auto w-[80px] shrink-0 rounded-lg shadow-md"
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
