interface Video {
  title: string;
  youtubeId: string;
}

/**
 * RFP feedback 5.0 (fallback masking audit): this section used to fall back to
 * a hardcoded copy of its content whenever the CMS returned nothing, so an
 * outage or an empty collection looked identical to a healthy page and no one
 * could tell the CMS had stopped feeding it. The prop is required now and an
 * empty list renders nothing — see docs for which collections still keep a
 * fallback (the ones with zero rows, where the fallback IS the live content).
 */
export function VideoGuideSection({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return null;

  return (
    <section
      className="bg-cover bg-center px-4 py-16 lg:px-[52px]"
      style={{ backgroundImage: "url(/images/kart-physical-used.svg)", backgroundColor: "#1a0000" }}
    >
      <h2 className="text-lg font-bold text-white">Vodafone Pay Fiziksel Kart nerelerde kullanılır?</h2>
      <p className="mt-1 text-lg text-white/80">Vodafone Fiziksel Kart nerelerde kullanılır?</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {videos.map((v) => (
          <div key={v.youtubeId}>
            <p className="mb-3 text-base text-white">{v.title}</p>
            <div className="aspect-video w-full overflow-hidden rounded-xl">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${v.youtubeId}`}
                title={v.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
