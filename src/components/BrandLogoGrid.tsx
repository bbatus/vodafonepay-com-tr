import Image from "next/image";

interface Brand {
  name: string;
  logo: string;
}

/**
 * RFP feedback 5.0 (fallback masking audit): this section used to fall back to
 * a hardcoded copy of its content whenever the CMS returned nothing, so an
 * outage or an empty collection looked identical to a healthy page and no one
 * could tell the CMS had stopped feeding it. The prop is required now and an
 * empty list renders nothing — see docs for which collections still keep a
 * fallback (the ones with zero rows, where the fallback IS the live content).
 */
export function BrandLogoGrid({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <div className="rounded-lg bg-white p-6 shadow-[0px_2px_12px_0px_#00000014] lg:p-10">
        <h2 className="text-xl font-bold text-black lg:text-2xl">Nerelerde kullanabilirim?</h2>
        <div className="mt-8 grid grid-cols-3 gap-6 sm:grid-cols-5">
          {brands.map((b) => (
            <div key={b.name} className="flex h-16 items-center justify-center">
              <Image src={b.logo} alt={b.name} width={80} height={40} className="h-auto max-h-10 w-auto max-w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
