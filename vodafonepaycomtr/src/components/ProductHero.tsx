import Image from "next/image";
import Link from "next/link";

/**
 * Mirrors vodafonepay.com.tr's own product hero, which is TWO layouts, not one
 * (measured against the live `.slide-image` slide on /aninda-bakiye):
 *
 *  - lg and up: the copy sits ON the image as a white, left-aligned overlay
 *    (`hidden lg:flex flex-col gap-y-4 max-w-md my-20 mx-8`), and there is NO
 *    grey band anywhere on the page.
 *  - below lg: that overlay is hidden and a `bg-gray-100` (#f3f4f6) strip
 *    appears under the image with the same copy centred in black, hugging the
 *    text (`my-[10px]`) rather than padding it out.
 *
 * This component used to render the grey band at EVERY breakpoint with
 * `px-6 py-8`, so on desktop the live site shows white space and we showed a
 * 96px grey slab the real site never has. The heading stays an <h1> in the
 * desktop branch and a plain <div> in the mobile one — same trick the live
 * markup uses, so the document keeps exactly one h1 at any width.
 *
 * Live geometry: 1030px max width, `rounded-[12px]`, image 322px tall on
 * desktop, `background-size: cover` centred.
 */
export function ProductHero({
  image,
  imageAlt,
  heading,
  subheading,
  ctaLabel,
  ctaUrl,
}: {
  image: string;
  imageAlt: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const cta =
    ctaLabel && ctaUrl ? (
      <Link href={ctaUrl} className="inline-block w-fit rounded bg-vf-red px-6 py-3 text-sm font-bold text-white">
        {ctaLabel}
      </Link>
    ) : null;

  return (
    <section className="mx-auto max-w-[1030px] px-4 lg:pt-4">
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src={image}
          alt={imageAlt}
          width={1030}
          height={322}
          priority
          className="h-[240px] w-full object-cover lg:h-[322px]"
        />
        <div className="absolute inset-y-0 left-0 hidden max-w-md flex-col justify-center gap-y-4 px-8 lg:flex">
          <h1 className="font-bold text-4xl leading-tight text-white">{heading}</h1>
          {subheading && <p className="font-light text-lg leading-7 text-white">{subheading}</p>}
          {cta}
        </div>
      </div>

      <div className="flex flex-col justify-center bg-[#f3f4f6] px-4 lg:hidden">
        <div className="my-[10px] text-center text-3xl font-bold leading-9 tracking-normal text-black">{heading}</div>
        {subheading && <p className="my-4 text-center font-light text-lg leading-7 text-black">{subheading}</p>}
        {cta && <div className="mb-4 flex justify-center">{cta}</div>}
      </div>
    </section>
  );
}
