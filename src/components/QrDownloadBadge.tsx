import Image from "next/image";

/**
 * Follow-up 25.08: "bu görsel orada hardcoded olmadan sanki seçilmiş gibi
 * dursun ... bunu product yükleyecek zaten ilgili görseli." Pulled out of
 * Footer.tsx's own bottom-row markup into its own component so it's a
 * single, swappable "slot" rather than an inline `<Image>` call, ready for
 * product to hand over a CMS-managed image later without touching Footer
 * itself.
 *
 * Follow-up 25.08 (5): used to also back a floating StickyQr widget shown
 * on every page — removed, since the real vodafonepay.com.tr has no such
 * floating widget anywhere (checked live) and having both it and this
 * footer badge on screen read as a duplicate, not a feature. This is the
 * only place the QR artwork renders now.
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
