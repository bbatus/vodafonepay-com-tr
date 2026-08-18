"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * RFP follow-up: doesn't exist on the live site at all (checked — no fixed
 * QR widget anywhere on vodafonepay.com.tr, homepage or inner pages), but
 * removing it outright would drop an existing feature across all 24 pages
 * that use it, which wasn't asked for. The actual bug is that a plain
 * `fixed … top-1/2` element has no idea how tall the page is — on a short
 * page (an inner page with little content, e.g. an empty CMS-driven
 * section) the viewport-centered box sits on top of the footer instead of
 * next to real content, because "half the viewport" and "half the page"
 * aren't the same thing there. This hides the box once the footer scrolls
 * into view, instead of letting it float over it regardless of page length.
 */
export function StickyQr() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), {
      rootMargin: "0px 0px -10% 0px",
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed left-0 top-1/2 z-[1000] hidden -translate-y-1/2 transition-opacity duration-200 xl:block ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
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
