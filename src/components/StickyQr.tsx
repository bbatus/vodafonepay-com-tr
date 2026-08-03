import Image from "next/image";

export function StickyQr() {
  return (
    <div className="fixed left-0 top-1/2 z-[1000] hidden -translate-y-1/2 xl:block">
      <Image
        src="/images/sticky-qr.png"
        alt="QR Code"
        width={160}
        height={200}
        priority
        className="h-auto w-[160px] rounded-lg shadow-md"
      />
    </div>
  );
}
