import { ImageWithText } from "@/components/ImageWithText";

/**
 * /vodafone-pay-kart's `widget_WhereCanIBuy`. The layout itself now lives in
 * ImageWithText — the CMS `imageWithText` block renders through the same
 * component, so this hand-written page and an editor-built one can't drift
 * apart the way the layout blocks originally did. Only the copy stays here,
 * since this page is not CMS-backed (R-22 keeps its body hardcoded).
 */
export function WhereCanIBuy() {
  return (
    <ImageWithText
      heading="Nereden satın alabilirim?"
      text="Çipli ve temassız yeni Vodafone Pay Fiziksel Kartlarını Vodafone Mağazalarından kolayca satın alabilirsiniz. Visa ve TROY logolu kartlarınla tüm fiziksel noktalarda ve online alışverişlerde harcamalarınızı gerçekleştirebilirsiniz."
      image="/images/kart-where-icon.svg"
      imageAlt="Nereden satın alabilirim?"
    />
  );
}
