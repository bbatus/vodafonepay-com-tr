"use client";

import { useState } from "react";
import { IL_ILCE } from "@/data/il-ilce";

const provinces = Object.keys(IL_ILCE);

export function TemsilciliklerimizForm() {
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");

  const districts = il ? IL_ILCE[il] : [];
  const canSearch = Boolean(il && ilce);

  const handleFind = () => {
    if (!canSearch) return;
    const query = encodeURIComponent(`Vodafone Mağaza ${ilce} ${il}`);
    window.open(`https://www.google.com/maps/search/${query}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-y-4 rounded-lg bg-white p-6 shadow-md">
      <div className="flex flex-col gap-y-2">
        <label htmlFor="il" className="text-sm font-bold text-black">
          İl
        </label>
        <select
          id="il"
          value={il}
          onChange={(e) => {
            setIl(e.target.value);
            setIlce("");
          }}
          className="rounded border border-gray-300 px-4 py-3 text-sm text-black focus:border-vf-red focus:outline-none"
        >
          <option value="">İl seçiniz</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-y-2">
        <label htmlFor="ilce" className="text-sm font-bold text-black">
          İlçe
        </label>
        <select
          id="ilce"
          value={ilce}
          onChange={(e) => setIlce(e.target.value)}
          disabled={!il}
          className="rounded border border-gray-300 px-4 py-3 text-sm text-black disabled:bg-gray-100 disabled:text-gray-400 focus:border-vf-red focus:outline-none"
        >
          <option value="">İlçe seçiniz</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={handleFind}
        disabled={!canSearch}
        className="mt-2 rounded bg-vf-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Bul
      </button>
    </div>
  );
}
