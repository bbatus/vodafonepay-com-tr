import type { Metadata } from "next";
import Image from "next/image";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, getPageMeta } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";
import { resolveDocumentFileUrl } from "@/lib/documentViewer";
import { RichText } from "@/components/RichText";
import { SozlesmelerAccordion, type SozlesmeDoc, type SozlesmeGroup } from "./SozlesmelerAccordion";

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
      { prefix: "Tüketici Hakları Bilgi Formu için ", label: "tıklayınız", href: "#", external: false },
      { prefix: "18.08.2026 tarihine kadar geçerli Ödeme Hizmetleri Çerçeve Kullanıcı Sözleşmesi için ", label: "tıklayınız", href: "#", external: false },
      { prefix: "18.08.2026 tarihi itibarı ile geçerli Ödeme Hizmetleri Çerçeve Kullanıcı Sözleşmesi için ", label: "tıklayınız", href: "#", external: false },
      { prefix: "Ticari Koşullar için ", label: "tıklayınız", href: "#", external: false },
    ],
  },
];

export default async function SozlesmelerVeFormlar() {
  const cmsPage = await getLegalPage("sozlesmeler-ve-formlar");
  // Follow-up 25.08 (3): each row resolves to one of the two flows the editor
  // chose between — an uploaded PDF/audio file, which links straight at the
  // file's own host so the click LEAVES this site (see
  // resolveDocumentFileUrl's doc comment), or a page written in the CMS,
  // which stays an ordinary internal route on our own domain.
  const groups: SozlesmeGroup[] = cmsPage
    ? cmsPage.groups.map((g) => ({
        label: g.label,
        documents: g.documents
          .filter((d) => d.enabled)
          .flatMap((d): SozlesmeDoc[] => {
            if (d.source === "page" && d.slug) {
              return [{ prefix: d.prefix, label: d.label, href: `/sozlesmeler-ve-formlar/${d.slug}`, external: false }];
            }
            const fileUrl = resolveDocumentFileUrl(d.file);
            // No usable upload yet (editor picked the PDF flow but hasn't
            // attached a file): skip the row instead of rendering a dead
            // "#" link that looks clickable and does nothing.
            return fileUrl ? [{ prefix: d.prefix, label: d.label, href: fileUrl, external: true }] : [];
          }),
      }))
    : fallbackGroups;
  const pageMeta = await getPageMeta("/sozlesmeler-ve-formlar");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
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
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">
          {cmsPage?.title || "Sözleşmeler ve Formlar"}
        </h1>

        {cmsPage?.intro ? <RichText data={cmsPage.intro} className="mt-4 flex flex-col gap-y-3 text-center" /> : null}

        <SozlesmelerAccordion groups={groups} />
      </section>

      <Footer />
    </main>
  );
}
