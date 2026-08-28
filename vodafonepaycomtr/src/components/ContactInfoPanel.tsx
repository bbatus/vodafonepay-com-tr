import type { CmsContactInfo } from "@/lib/cms";

/**
 * The live site's `widget_FooterPages\ContactInfo` (/iletisim). Exposed as a
 * shared component so the CMS `contactInfo` block can drop the same panel onto
 * any editor-built page — previously these details could only ever appear on
 * the one hand-written /iletisim route.
 *
 * Reads the ContactInfo global, so there is exactly one place to edit them and
 * every page showing this block follows.
 */
function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-gray-200 py-4 last:border-b-0 lg:flex-row lg:gap-6">
      <span className="w-full shrink-0 text-base font-bold text-black lg:w-[280px]">{label}</span>
      <span className="text-base text-[#333]">{value}</span>
    </div>
  );
}

export function ContactInfoPanel({ info, heading }: { info: CmsContactInfo; heading?: string }) {
  return (
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      {heading && <h2 className="mb-8 text-2xl font-bold text-black lg:text-4xl">{heading}</h2>}
      <div className="rounded-md bg-vf-gray px-5 py-2 lg:px-8">
        <Row label="Şirket Unvanı" value={info.companyName} />
        <Row label="Ticaret Sicil No" value={info.tradeRegistryNo} />
        <Row label="Adres" value={info.address} />
        <Row label="Telefon" value={info.phone} />
        <Row label="KEP Adresi" value={info.kepAddress} />
        <Row label="Müşteri Hizmetleri" value={info.customerServiceText} />
      </div>
    </section>
  );
}
