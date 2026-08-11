import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getRepresentativeById } from "@/lib/cms";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const rep = await getRepresentativeById(id);
  if (!rep) return {};
  return {
    title: `${rep.businessName} | Vodafone Pay Temsilciliği`,
    description: rep.address,
  };
}

export default async function TemsilciDetay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rep = await getRepresentativeById(id);
  if (!rep) notFound();

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={rep.businessName} />

      <section className="mx-auto w-full max-w-[560px] px-4 pb-20">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h1 className="text-2xl font-bold text-black">{rep.businessName}</h1>
          {rep.repCode && <p className="mt-1 text-sm text-gray-500">Temsilci Kodu: {rep.repCode}</p>}

          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="font-bold text-black">Adres</dt>
              <dd className="mt-1 text-gray-600">{rep.address}</dd>
              <dd className="text-gray-600">
                {rep.district} / {rep.province}
              </dd>
            </div>
            {rep.phone && (
              <div>
                <dt className="font-bold text-black">Telefon</dt>
                <dd className="mt-1 text-gray-600">{rep.phone}</dd>
              </div>
            )}
            {rep.activityDescription && (
              <div>
                <dt className="font-bold text-black">Faaliyet</dt>
                <dd className="mt-1 text-gray-600">{rep.activityDescription}</dd>
              </div>
            )}
            {rep.authorizedPerson && (
              <div>
                <dt className="font-bold text-black">Yetkili</dt>
                <dd className="mt-1 text-gray-600">{rep.authorizedPerson}</dd>
              </div>
            )}
            {rep.mersisNo && (
              <div>
                <dt className="font-bold text-black">Mersis No</dt>
                <dd className="mt-1 text-gray-600">{rep.mersisNo}</dd>
              </div>
            )}
          </dl>

          {rep.qrCode && (
            <Image
              src={rep.qrCode.url}
              alt={rep.qrCode.alt || `${rep.businessName} QR kod`}
              width={160}
              height={160}
              className="mt-6 h-auto w-32"
            />
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
