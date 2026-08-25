import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-24 text-center">
        <span className="text-vf-red text-6xl font-bold">404</span>
        <h1 className="mt-4 text-[32px] font-light leading-[40px] text-black">Aradığınız sayfa bulunamadı</h1>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          Bağlantı hatalı olabilir ya da sayfa taşınmış olabilir. Ana sayfaya dönerek aramaya devam edebilirsiniz.
        </p>
        <Link
          href="/"
          className="bg-vf-red mt-8 rounded-full px-8 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          Ana Sayfaya Dön
        </Link>
      </section>

      <Footer />
    </main>
  );
}
