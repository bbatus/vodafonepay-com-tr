const videos = [
  {
    title: "Vodafone Pay Uygulaması üzerinden kare kod ile Türkiye'deki tüm ATM'lerden nasıl para çekersin?",
    youtubeId: "7CCEsOaoH2A",
  },
  {
    title: "Vodafone Pay Uygulaması üzerinden kare kod (QR) ile nasıl ödeme yapabilirsin?",
    youtubeId: "0BCJdFpVCSw",
  },
];

export function VideoGuideSection() {
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
