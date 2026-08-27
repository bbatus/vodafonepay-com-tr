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
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      {/* Live `widget_VideosWithTabs`: the pill strip is bg-white, and the
          ACTIVE tab is filled near-black (#0D0D0D) with white text at a fixed
          286px — not a white-on-grey "selected" chip with grey inactive text,
          which is what this used to render. */}
      <div className="mx-auto mb-5 flex w-fit max-w-full items-center justify-center gap-x-2 overflow-x-auto rounded-lg bg-white">
        {tabs.map((tab, i) => (
          <button
            type="button"
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`m-1 shrink-0 rounded-md px-2 py-3 text-xs font-light transition-colors lg:w-[286px] lg:px-10 lg:text-base ${
              activeTab === i ? "bg-[#0D0D0D] text-white" : "text-black"
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
