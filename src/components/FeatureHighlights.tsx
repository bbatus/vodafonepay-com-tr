import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

interface Highlight {
  icon: string;
  title: string;
  description: string;
}

/**
 * RFP feedback 5.0 (fallback masking audit): this section used to fall back to
 * a hardcoded copy of its content whenever the CMS returned nothing, so an
 * outage or an empty collection looked identical to a healthy page and no one
 * could tell the CMS had stopped feeding it. The prop is required now and an
 * empty list renders nothing — see docs for which collections still keep a
 * fallback (the ones with zero rows, where the fallback IS the live content).
 */
export function FeatureHighlights({ features }: { features: Highlight[] }) {
  if (features.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-10">
      <div className="flex items-center gap-x-10">
        <div className="flex w-full flex-col gap-y-6 lg:w-1/3">
          {features.map((feature) => (
            <div key={feature.title} className="flex gap-x-4">
              <Image src={feature.icon} alt={feature.title} width={36} height={36} className="h-9 w-9 shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-black">{feature.title}</h3>
                <p className="mt-1 text-lg leading-5 text-black/70">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden w-2/3 overflow-hidden rounded-xl lg:block">
          <video className="h-[340px] w-full object-cover" src="/videos/feature-loop.mp4" autoPlay muted loop playsInline />
        </div>
      </div>

      <div className="mb-10 mt-10 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black lg:text-4xl">Kampanyalar</h2>
        <Link href="/kampanyalar" className="flex items-center gap-x-1 text-sm font-bold text-vf-red">
          İncele <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
