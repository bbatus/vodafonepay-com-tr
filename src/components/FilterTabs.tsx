"use client";

import { useState } from "react";

const filters = ["Tümü", "Anında Bakiye", "Faturana Yansıt", "Kart"];

export function FilterTabs() {
  const [active, setActive] = useState(filters[0]);

  return (
    <div className="hidden items-center gap-2 lg:flex">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setActive(f)}
          className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
            active === f ? "border-vf-navy bg-vf-navy text-white" : "border-gray-300 bg-white text-black hover:bg-gray-50"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
