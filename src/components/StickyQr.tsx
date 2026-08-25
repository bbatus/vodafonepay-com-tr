"use client";

import { useEffect, useState } from "react";
import { QrDownloadBadge } from "@/components/QrDownloadBadge";

/**
 * RFP follow-up: doesn't exist on the live site at all (checked — no fixed
 * QR widget anywhere on vodafonepay.com.tr, homepage or inner pages), but
 * removing it outright would drop an existing feature across all 24 pages
 * that use it, which wasn't asked for.
 *
 * Follow-up 25.08 — the real bug, found live: "sürekli footerdan çıkıyor"
 * turned out to be a startup FLASH, not a scroll-tracking failure. The
 * previous version defaulted `hidden` to `false` (visible), so on every
 * page load the widget rendered at full opacity for the one frame BEFORE
 * the IntersectionObserver's first callback ever fires. On a normal long
 * page that frame is invisible (footer is far below, nothing to overlap).
 * On a SHORT page — reproduced live on /kampanyalar when its content
 * failed to load — the footer is already inside the initial viewport, so
 * that one frame renders the widget sitting directly on top of the
 * footer's own text before the observer corrects it a moment later.
 *
 * Fix: default to hidden (`null` = "don't know yet", rendered exactly like
 * hidden) and only ever reveal the widget once the observer has positively
 * confirmed the footer is NOT on screen. A page with a long scroll shows the
 * widget a beat later than before; a short page never shows it overlapping
 * the footer at all — the actual bug is gone, not just less likely.
 *
 * The footer lookup itself also no longer gives up after a single
 * `getElementById` at mount: Footer is an async server component, so on a
 * slow CMS response its DOM node can genuinely not exist yet on the first
 * effect run. A few retries covers that without needing a MutationObserver
 * for what's normally already-present markup.
 */
export function StickyQr() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const attach = (attemptsLeft: number) => {
      const footer = document.getElementById("site-footer");
      if (!footer) {
        if (attemptsLeft > 0) retryTimer = setTimeout(() => attach(attemptsLeft - 1), 200);
        return;
      }
      observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
        rootMargin: "0px 0px -10% 0px",
      });
      observer.observe(footer);
    };

    attach(10);
    return () => {
      observer?.disconnect();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return (
    <div
      className={`fixed left-0 top-1/2 z-[1000] hidden -translate-y-1/2 transition-opacity duration-200 xl:block ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <QrDownloadBadge />
    </div>
  );
}
