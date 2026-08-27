import Image from "next/image";

/**
 * The live site's "one illustration, copy beside it" section — it ships this
 * shape twice under two widget names (`widget_WhereCanIBuy` on
 * /vodafone-pay-kart, `widget_WhereCanIUse` on /faturana-yansit) with nothing
 * different but the content, so this is one component rather than two.
 *
 * Geometry read off the live `widget_WhereCanIBuy` markup:
 *   container  flex items-center flex-col lg:flex-row
 *   image box  flex w-full max-w-[574px] bg-white rounded-md
 *   image      w-[65vw] lg:max-w-[434px] lg:w-full h-auto
 *   copy       w-full lg:w-auto ml-10 my-6 lg:my-0
 *   heading    text-[24px] lg:text-[28px] leading-8
 *   body       text-[14px] lg:text-[18px] leading-[26px] mt-5 max-w-[370px]
 *
 * `imageSide` exists because the live site uses both orders across its pages
 * (the copy sits right of the art on /vodafone-pay-kart, left of it in the
 * `NasilKazanirim` family), and an editor shouldn't need a developer to flip
 * it. On mobile the image always comes first, matching live.
 */
export function ImageWithText({
  heading,
  text,
  image,
  imageAlt,
  imageSide = "left",
}: {
  heading: string;
  text: string;
  image: string;
  imageAlt: string;
  imageSide?: "left" | "right";
}) {
  return (
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      <div className="flex flex-col items-center lg:flex-row">
        <div
          className={`flex w-full max-w-[574px] justify-center rounded-md bg-white ${
            imageSide === "right" ? "order-1 lg:order-2" : "order-1"
          }`}
        >
          <Image
            src={image}
            alt={imageAlt || heading}
            width={434}
            height={260}
            className="h-auto w-[65vw] lg:w-full lg:max-w-[434px]"
          />
        </div>
        <div
          className={`my-6 w-full lg:my-0 lg:w-auto ${
            imageSide === "right" ? "order-2 lg:order-1 lg:mr-10" : "order-2 lg:ml-10"
          }`}
        >
          <h2 className="text-[24px] font-bold leading-8 text-black lg:text-[28px]">{heading}</h2>
          <p className="mt-5 w-full max-w-[370px] font-light text-[14px] leading-[26px] text-black lg:text-[18px]">
            {text}
          </p>
        </div>
      </div>
    </section>
  );
}
