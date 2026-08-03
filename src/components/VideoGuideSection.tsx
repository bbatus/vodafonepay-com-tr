const videos = [
  {
    title: "Vodafone Pay Fiziksel Kart nerelerde kullanılır?",
    subtitle: "Vodafone Fiziksel Kart nerelerde kullanılır?",
    youtubeId: "7CCEsOaoH2A",
  },
  {
    title: "Vodafone Pay Uygulaması üzerinden kare kod ile Türkiye'deki tüm ATM'lerden nasıl para çekersin?",
    subtitle: "",
    youtubeId: "0BCJdFpVCSw",
  },
];

export function VideoGuideSection() {
  return (
    <section className="bg-black px-4 py-16">
      <div className="mx-auto flex max-w-[1030px] flex-col gap-y-10">
        {videos.map((v) => (
          <div key={v.youtubeId}>
            <h3 className="text-xl font-bold text-white">{v.title}</h3>
            {v.subtitle && <p className="mt-1 text-gray-400">{v.subtitle}</p>}
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl">
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
