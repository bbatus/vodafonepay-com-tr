"use client";

import { useState } from "react";
import { FaqChevronIcon } from "@/components/icons";

export function FaydaliBilgilerAccordion() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between rounded bg-white px-5 py-[22px] text-left shadow-[0px_2px_8px_0px_#00000029]"
      >
        <h3 className="font-bold text-black">Faydalı Bilgiler</h3>
        <FaqChevronIcon className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="rounded bg-gray-50 px-5 py-4">
          <p className="text-sm text-gray-700">
            Vodafone Pay&apos;e Cüzdan kodu ile nasıl yükleme yapabileceğinizi görmek için tıklayınız
          </p>
        </div>
      )}
    </div>
  );
}
