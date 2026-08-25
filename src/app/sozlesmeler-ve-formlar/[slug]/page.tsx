import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { RichText } from "@/components/RichText";
import { getLegalPage } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

/**
 * Follow-up 25.08: the "kendin oluştur" half of the Sözleşmeler ve Formlar
 * flow. A document the editor typed into the CMS (rather than uploading as a
 * PDF) is published here as a real page on our own domain — unlike the live
 * vodafonepay.com.tr, where every one of these links leaves for a raw PDF on
 * cms.vodafone.com.tr.
 *
 * The documents live inside the `sozlesmeler-ve-formlar` legal page's own
 * `groups` array rather than in a collection of their own, so this route
 * fetches that one page and finds the matching row by slug.
 */
async function findDocument(slug: string) {
  const page = await getLegalPage("sozlesmeler-ve-formlar");
  if (!page) return null;
  for (const group of page.groups) {
    for (const doc of group.documents) {
      if (doc.enabled && doc.source === "page" && doc.slug === slug) {
        return { doc, groupLabel: group.label };
      }
    }
  }
  return null;
}

export async function generateStaticParams() {
  const page = await getLegalPage("sozlesmeler-ve-formlar");
  if (!page) return [];
  return page.groups.flatMap((group) =>
    group.documents
      .filter((doc) => doc.enabled && doc.source === "page" && doc.slug)
      .map((doc) => ({ slug: doc.slug as string }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await findDocument(slug);
  return buildMetadata({
    title: found ? `${found.doc.label} | Vodafone Pay` : "Sözleşmeler ve Formlar | Vodafone Pay",
    description: found?.doc.label ?? "Vodafone Pay sözleşme ve formları.",
    path: `/sozlesmeler-ve-formlar/${slug}`,
  });
}

export default async function SozlesmeDetay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await findDocument(slug);
  if (!found) notFound();

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={found.doc.label} />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <h1 className="text-[32px] font-light leading-[40px] text-black">{found.doc.label}</h1>
        <p className="mt-2 text-sm text-gray-500">{found.groupLabel}</p>

        <div className="mt-8">
          <RichText data={found.doc.body} className="flex flex-col gap-y-4 text-base leading-7 text-gray-800" />
        </div>

        <Link
          href="/sozlesmeler-ve-formlar"
          className="mt-10 inline-block text-sm font-bold text-vf-red underline underline-offset-2 hover:text-red-700"
        >
          ← Sözleşmeler ve Formlar
        </Link>
      </section>

      <Footer />
    </main>
  );
}
