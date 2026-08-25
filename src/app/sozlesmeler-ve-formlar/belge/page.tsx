import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { isAllowedFileUrl, type DocumentKind } from "@/lib/documentViewer";

/**
 * Follow-up 25.08: the dedicated viewer route buildDocumentViewerHref()
 * (lib/documentViewer.ts) links every uploaded PDF/audio document to —
 * see that file's doc comment for why this exists instead of a raw MinIO
 * link. `src`/`tur` come from OUR OWN link generation (every real link on
 * the site is built by buildDocumentViewerHref, never typed by a visitor),
 * but this is still a public route reading its own query string, so `src`
 * is re-validated against the same MinIO-host allowlist regardless —
 * defense in depth against a hand-crafted URL, not just trusting the caller.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ad?: string }>;
}): Promise<Metadata> {
  const { ad } = await searchParams;
  return { title: `${ad || "Belge"} | Vodafone Pay` };
}

export default async function BelgeGoruntule({
  searchParams,
}: {
  searchParams: Promise<{ src?: string; ad?: string; tur?: string }>;
}) {
  const { src, ad, tur } = await searchParams;
  const label = ad || "Belge";
  const kind: DocumentKind = tur === "audio" ? "audio" : "pdf";

  if (!src || !isAllowedFileUrl(src)) notFound();

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={label} />

      <section className="mx-auto w-full max-w-4xl px-4 pb-20">
        <h1 className="text-[28px] font-light leading-[36px] text-black">{label}</h1>

        {kind === "audio" ? (
          <div className="mt-8 rounded bg-white p-8 shadow-[0px_2px_8px_0px_#00000029]">
            <audio controls src={src} className="w-full">
              Tarayıcınız ses oynatmayı desteklemiyor.
            </audio>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded bg-white shadow-[0px_2px_8px_0px_#00000029]">
            <iframe src={src} title={label} className="h-[80vh] w-full" />
          </div>
        )}

        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-bold text-vf-red underline underline-offset-2 hover:text-red-700"
        >
          {kind === "audio" ? "Ses dosyasını yeni sekmede aç" : "PDF'i yeni sekmede aç"}
        </a>
        <br />
        <Link
          href="/sozlesmeler-ve-formlar"
          className="mt-2 inline-block text-sm font-bold text-vf-red underline underline-offset-2 hover:text-red-700"
        >
          ← Sözleşmeler ve Formlar
        </Link>
      </section>

      <Footer />
    </main>
  );
}
