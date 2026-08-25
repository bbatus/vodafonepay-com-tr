import Image from "next/image";

/**
 * Follow-up 25.08: "bu görsel orada hardcoded olmadan sanki seçilmiş gibi
 * dursun ... bunu product yükleyecek zaten ilgili görseli." The same QR/app-
 * download artwork was duplicated as a raw `<Image src="/images/sticky-qr.png">`
 * call in two places (StickyQr.tsx's floating widget, Footer.tsx's own
 * bottom-row copy) — one real asset, pasted twice. Pulling it into its own
 * component is what makes it a single, swappable "slot" instead of two
 * hardcoded copies that would each need editing separately once product
 * hands over a CMS-managed image for it.
 */
export function QrDownloadBadge({ className }: { className?: string }) {
  return (
    <Image
      src="/images/sticky-qr.png"
      alt="Vodafone Pay QR Kodu"
      width={160}
      height={200}
      priority
      className={className ?? "h-auto w-[160px] rounded-lg shadow-md"}
    />
  );
}
