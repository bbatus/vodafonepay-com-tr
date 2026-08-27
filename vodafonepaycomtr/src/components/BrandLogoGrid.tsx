import Image from "next/image";
import Link from "next/link";

interface Brand {
  name: string;
  logo: string;
  linkUrl?: string;
}

/**
 * The live site's `widget_WhereCanIUse` (/faturana-yansit) — "Nerelerde
 * kullanabilirim?".
 *
 * Measured off the live widget, because the previous version of this
 * component (and the CMS `logoGrid` block built from it) got several things
 * wrong at once: it drew 80x40 logos in a 64px row with NO brand name at all,
 * inside a 1030px white card with a drop shadow.
 *
 * What the live site actually renders:
 *   wrapper  w-full max-w-[1400px] mx-auto py-10 px-5
 *   card     bg-white rounded-lg px-4 lg:p-10 xl:p-[60px]   ← no shadow
 *   heading  text-xl lg:text-2xl xl:text-[32px] text-left
 *   tile     140x140 at xl (120/100/80 down the breakpoints), rounded-2xl,
 *            TRANSPARENT background, p-5, logo object-contain inside
 *   label    the brand name under each tile, text-xs → xl:text-lg
 *
 * Live scrolls these in a swiper; a horizontally scrollable flex row gives
 * the same result without pulling in a carousel library for what is a list
 * of logos.
 */
export function BrandLogoGrid({
  brands,
  heading = "Nerelerde kullanabilirim?",
}: {
  brands: Brand[];
  heading?: string;
}) {
  if (brands.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 py-10">
      <div className="rounded-lg bg-white px-4 lg:p-10 xl:p-[60px]">
        <h2 className="mb-6 text-left text-xl font-bold text-black lg:mb-8 lg:text-2xl xl:mb-10 xl:text-[32px]">
          {heading}
        </h2>
        <div className="flex gap-x-6 overflow-x-auto pb-2 lg:justify-center lg:gap-x-10">
          {brands.map((b) => {
            const tile = (
              <div className="flex flex-col items-center gap-3 text-center lg:gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl p-4 sm:h-[100px] sm:w-[100px] lg:h-[120px] lg:w-[120px] lg:rounded-2xl lg:p-5 xl:h-[140px] xl:w-[140px]">
                  <Image
                    src={b.logo}
                    alt={b.name}
                    width={140}
                    height={140}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="text-xs text-black sm:text-sm lg:text-base xl:text-lg">{b.name}</div>
              </div>
            );
            return (
              <div key={b.name} className="shrink-0">
                {b.linkUrl ? <Link href={b.linkUrl}>{tile}</Link> : tile}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
