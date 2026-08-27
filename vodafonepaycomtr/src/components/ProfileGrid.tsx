import Image from "next/image";

/**
 * The live site's `widget_BoardOfDirectors` (/kurumsal-yonetim) — a grid of
 * people cards. Kept generic (`ProfileGrid`) rather than named after the board,
 * because the shape is "photo + name + role", which suits any team/management
 * listing an editor might build.
 *
 * Geometry read off the live widget:
 *   grid   grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5
 *   card   max-w-[331px] bg-white p-5 rounded-md flex flex-col
 *   photo  w-full max-w-[291px] rounded-md h-[200px] object-cover
 */
export function ProfileGrid({
  heading,
  people,
}: {
  heading?: string;
  people: { photo: string; name: string; title: string }[];
}) {
  if (people.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      {heading && <h2 className="text-2xl font-bold text-black lg:text-4xl">{heading}</h2>}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <div key={p.name} className="mx-auto flex w-full max-w-[331px] flex-col rounded-md bg-vf-gray p-5 lg:mx-0">
            <Image
              src={p.photo}
              alt={p.name}
              width={291}
              height={200}
              className="h-[200px] w-full max-w-[291px] rounded-md object-cover"
            />
            <span className="mt-4 text-lg font-bold leading-7 text-black">{p.name}</span>
            <span className="mt-1 text-base font-light text-black/70">{p.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
