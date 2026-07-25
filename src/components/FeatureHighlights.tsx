import Link from "next/link";

const features = [
  {
    title: "Akıllı Ödeme Yöntemleri",
    description: "Vodafone Pay'in tüm ürünleriyle dilediğiniz yerde hızlı ve güvenli harcama imkanı.",
    hasVideo: true,
  },
  {
    title: "Harcadıkça Kazandıran",
    description: "Alışverişlerinizde nakit iade, fatura indirimi ve GB kazanma imkanı.",
    hasVideo: true,
  },
  {
    title: "Size Özel Limit",
    description: "Size özel limitlerinizle dilediğinizce alışveriş yapma imkanı.",
    hasVideo: false,
  },
];

export function FeatureHighlights() {
  return (
    <section className="bg-[#f9fafb] px-4 py-16 lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm">
            {feature.hasVideo ? (
              <video
                className="mb-4 h-40 w-full rounded-lg object-cover"
                src="/videos/feature-loop.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div className="mb-4 h-40 w-full rounded-lg bg-[#27455c]" />
            )}
            <h3 className="text-xl font-bold text-black">{feature.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          href="/kampanyalar"
          className="rounded-[2px] bg-[#e60000] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Kampanyalar İncele
        </Link>
      </div>
    </section>
  );
}
