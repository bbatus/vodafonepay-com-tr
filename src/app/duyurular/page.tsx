import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { DuyurularAccordion, type Announcement } from "./DuyurularAccordion";
import { getAnnouncements, textToParagraphs } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Vodafone Pay Duyurular | Resmî Bildirimler ve Açıklamalar",
  description: "Vodafone Pay'e ait resmî duyurular, bildirimler ve açıklamalar.",
};

export default async function Duyurular() {
  const cmsAnnouncements = await getAnnouncements();
  const items: Announcement[] | undefined = cmsAnnouncements?.length
    ? cmsAnnouncements.map((a) => ({
        title: a.title,
        body: (
          <>
            {textToParagraphs(a.body).map((p, i) => (
              <p key={i} className={i > 0 ? "mt-3" : undefined}>
                {p}
              </p>
            ))}
          </>
        ),
      }))
    : undefined;

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current="Duyurular" />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Duyurular</h1>

        <div className="mt-10">
          <DuyurularAccordion items={items} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
