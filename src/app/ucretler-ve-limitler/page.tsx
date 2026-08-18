import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ContentUnavailable } from "@/components/ContentUnavailable";
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
  // `null` = CMS fetch/parse failed, `[]` = CMS reachable but genuinely has
  // zero rows yet — same ContentUnavailable pattern as kampanyalar/blog.
  // No hardcoded fallback numbers any more (see PricesAndLimits.tsx).
  const [cmsFeeRows, cmsLimitTables] = await Promise.all([getFeeRows(), getLimitTables()]);

  const feeRows: [string, string][] = (cmsFeeRows ?? []).map((r) => [r.label, r.value]);
  const limitTables = (cmsLimitTables ?? []).map((t) => ({
    title: t.title,
    rows: t.rows.map((r): [string, string, string, string] => [r.category, r.period, r.unverifiedLimit, r.verifiedLimit]),
  }));

  const pageMeta = await getPageMeta("/ucretler-ve-limitler");

  let content: ReactNode;
  if (cmsFeeRows === null && cmsLimitTables === null) {
    content = <ContentUnavailable variant="error" />;
  } else if (feeRows.length === 0 && limitTables.length === 0) {
    content = <ContentUnavailable variant="empty" />;
  } else {
    content = <PricesAndLimits feeRows={feeRows} limitTables={limitTables} />;
  }

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Ücretler ve Limitler"} />
      <h1 className="mx-auto max-w-[1030px] px-4 pt-2 text-center text-[40px] font-light leading-[48px] text-black">
        Ücretler ve Limitler
      </h1>
      {content}
      <Footer />
    </main>
  );
}
