import Image from "next/image";

/**
 * The live site's `widget_PhysicalCardUsed` (/vodafone-pay-kart): a panel that
 * uses an image as its BACKGROUND, with white copy over it and an optional
 * video embedded inside.
 *
 * Measured off the live widget:
 *   panel   background-image, content `py-10 px-[52px] flex flex-col gap-y-3`
 *   title   font-vodafone-bold text-lg leading-7 text-white
 *   body    font-vodafone-light text-lg text-white
 *   video   `data-video-id` → a YouTube embed inside the panel
 *
 * Kept generic (`MediaPanel`) rather than named after the physical card,
 * because "art as the backdrop, copy and a video on top" is a shape any
 * campaign or product section can reuse.
 */
export function MediaPanel({
  heading,
  text,
  backgroundImage,
  youtubeId,
}: {
  heading: string;
  text?: string;
  backgroundImage: string;
  youtubeId?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src={backgroundImage}
          alt=""
          width={1030}
          height={420}
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative flex flex-col gap-y-3 px-6 py-10 lg:px-[52px]">
          <span className="text-lg font-bold leading-7 text-white">{heading}</span>
          {text && <span className="font-light text-lg leading-[26px] text-white">{text}</span>}
          {youtubeId && (
            <div className="mt-2 aspect-video w-full max-w-[480px] overflow-hidden rounded-md">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                title={heading}
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
