"use client";

import { useState } from "react";

const tabs = [
  {
    label: "Faturana Yansıt'ı alışverişte nasıl kullanırım?",
    items: ["Hesap Doğrulama", "YouTube Premium", "Yanımda Premium", "Google Play", "App Store"],
  },
  {
    label: "Faturana Yansıt'ı nasıl açarım?",
    items: ["App Store", "Google Play"],
  },
];

export function VideosWithTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <div className="mx-auto flex w-full max-w-3xl justify-center rounded-lg bg-vf-gray p-1">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`flex-1 rounded-md px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === i ? "bg-white text-black shadow-sm" : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex gap-x-4 overflow-x-auto pb-2">
        {tabs[activeTab].items.map((item) => (
          <div key={item} className="flex w-[180px] shrink-0 flex-col items-center gap-y-3 rounded-xl bg-vf-gray p-4">
            <div className="flex h-[280px] w-full items-center justify-center rounded-lg bg-black/90">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                <div className="ml-1 h-0 w-0 border-y-8 border-l-[14px] border-y-transparent border-l-black" />
              </div>
            </div>
            <p className="text-center text-sm font-bold text-black">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
