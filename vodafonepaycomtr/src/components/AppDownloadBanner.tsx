"use client";

import { useState } from "react";
import Image from "next/image";
import { CloseIcon } from "@/components/icons";

export function AppDownloadBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-x-3 bg-black px-4 py-3 lg:hidden">
      <div className="flex items-center gap-x-3">
        <Image src="/images/vpay-logo.svg" alt="Vodafone Pay" width={32} height={32} className="rounded bg-vf-red p-1" />
        <span className="text-sm text-white underline">Vodafone Pay uygulamasını indir</span>
      </div>
      <button type="button" aria-label="Kapat" onClick={() => setVisible(false)}>
        <CloseIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );
}
