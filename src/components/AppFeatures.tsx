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
export function AppFeatures({ slides }: { slides: Slide[] }) {
  if (slides.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-black lg:text-4xl">Vodafone Pay&apos;in Ayrıcalıklı Dünyası</h2>
        <p className="mt-4 text-base text-gray-600">
          Vodafone Pay Uygulaması&apos;nı indirerek tüm harcamalarınızı kolayca takip edebilir, kazandıran
          kampanyalara katılabilirsiniz.
        </p>
      </div>
      <ImageSideCarousel sideImage="/images/step-app.png" sideImageAlt="Vodafone Pay Uygulaması" slides={slides} />
    </section>
  );
}
