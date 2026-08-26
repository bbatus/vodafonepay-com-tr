import { ImageSideCarousel } from "@/components/ImageSideCarousel";

interface Slide {
  image: string;
  text: string;
}

/**
 * RFP feedback 5.0 (fallback masking audit): this section used to fall back to
 * a hardcoded copy of its content whenever the CMS returned nothing, so an
 * outage or an empty collection looked identical to a healthy page and no one
 * could tell the CMS had stopped feeding it. The prop is required now and an
 * empty list renders nothing — see docs for which collections still keep a
 * fallback (the ones with zero rows, where the fallback IS the live content).
 */
export function EarnWithCard({ slides }: { slides: Slide[] }) {
  if (slides.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <h2 className="text-2xl font-bold text-black lg:text-4xl">Vodafone Pay Kart ile Kazan</h2>
      <p className="mt-4 max-w-2xl text-base text-gray-600">
        Vodafone Pay Sanal ve Fiziksel Kart ile harcamalarını kolayca ve güvenli bir şekilde
        gerçekleştirebilir, kazandığın nakit iadelerle daha fazla harcayabilirsin.
      </p>
      <ImageSideCarousel sideImage="/images/kart-visa.svg" sideImageAlt="Vodafone Pay Kart" slides={slides} />
    </section>
  );
}
