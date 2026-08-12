import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PricesAndLimits } from "@/components/PricesAndLimits";
import { Footer } from "@/components/Footer";
import { getFeeRows, getLimitTables, getPageMeta } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/ucretler-ve-limitler");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Ücretler ve Limitler | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay ürün ve hizmetlerine ait güncel ücret ve limit bilgileri.",
    path: "/ucretler-ve-limitler",
    image: pageMeta?.ogImage?.url,
  });
}

export default async function UcretlerVeLimitler() {
  const [cmsFeeRows, cmsLimitTables] = await Promise.all([getFeeRows(), getLimitTables()]);

  const feeRows = cmsFeeRows?.length ? cmsFeeRows.map((r): [string, string] => [r.label, r.value]) : undefined;
  const limitTables = cmsLimitTables?.length
    ? cmsLimitTables.map((t) => ({
        title: t.title,
        rows: t.rows.map((r): [string, string, string, string] => [
          r.category,
          r.period,
          r.unverifiedLimit,
          r.verifiedLimit,
        ]),
      }))
    : undefined;

  const pageMeta = await getPageMeta("/ucretler-ve-limitler");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Ücretler ve Limitler"} />
      <h1 className="mx-auto max-w-[1030px] px-4 pt-2 text-center text-[40px] font-light leading-[48px] text-black">
        Ücretler ve Limitler
      </h1>
      <PricesAndLimits feeRows={feeRows} limitTables={limitTables} />
      <Footer />
    </main>
  );
}
