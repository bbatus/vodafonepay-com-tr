import type { Metadata } from "next";
import Image from "next/image";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, getPageMeta } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";
import { buildDocumentViewerHref } from "@/lib/documentViewer";
import { SozlesmelerAccordion, type SozlesmeGroup } from "./SozlesmelerAccordion";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/sozlesmeler-ve-formlar");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Sözleşmeler ve Formlar | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay sözleşme, form ve ticari koşullar belgelerine buradan ulaşabilirsiniz.",
    keywords: pageMeta?.seoKeywords || undefined,
    path: "/sozlesmeler-ve-formlar",
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
const fallbackGroups: SozlesmeGroup[] = [
  {
    label: "Sözleşmeler ve Formlar",
    documents: [
      { label: "Tüketici Hakları Bilgi Formu için tıklayınız", href: "#" },
      { label: "18.08.2026 tarihine kadar geçerli Ödeme Hizmetleri Çerçeve Kullanıcı Sözleşmesi için tıklayınız.", href: "#" },
      { label: "18.08.2026 tarihi itibarı ile geçerli Ödeme Hizmetleri Çerçeve Kullanıcı Sözleşmesi için tıklayınız.", href: "#" },
      { label: "Ticari Koşullar için tıklayınız.", href: "#" },
    ],
  },
];

export default async function SozlesmelerVeFormlar() {
  const cmsPage = await getLegalPage("sozlesmeler-ve-formlar");
  // Follow-up 25.08: each row resolves to one of the two flows the editor
  // chose between — an uploaded PDF/audio file (never linked to its raw
  // MinIO URL — see buildDocumentViewerHref's doc comment for why it routes
  // through our own /sozlesmeler-ve-formlar/belge viewer instead) or a page
  // written in the CMS (an internal route on our own domain). Both are
  // ordinary internal routes now.
  const groups: SozlesmeGroup[] = cmsPage
    ? cmsPage.groups.map((g) => ({
        label: g.label,
        documents: g.documents
          .filter((d) => d.enabled)
          .map((d) =>
            d.source === "page" && d.slug
              ? { label: d.label, href: `/sozlesmeler-ve-formlar/${d.slug}` }
              : {
                  label: d.label,
                  href: d.file?.url ? buildDocumentViewerHref({ url: d.file.url, label: d.label, mimeType: d.file.mimeType }) : "#",
                }
          ),
      }))
    : fallbackGroups;
  const pageMeta = await getPageMeta("/sozlesmeler-ve-formlar");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Sözleşmeler ve Formlar"} />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        {cmsPage?.heroImage ? (
          <Image
            src={cmsPage.heroImage.url}
            alt={cmsPage.heroImage.alt || "Sözleşmeler ve Formlar"}
            width={840}
            height={420}
            className="mb-8 h-auto w-full rounded-md object-cover"
          />
        ) : null}
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Sözleşmeler ve Formlar</h1>

        <SozlesmelerAccordion groups={groups} />
      </section>

      <Footer />
    </main>
  );
}
