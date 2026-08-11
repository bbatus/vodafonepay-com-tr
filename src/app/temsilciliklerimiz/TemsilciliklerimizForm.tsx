"use client";

import { useState } from "react";
import Link from "next/link";
import { IL_ILCE } from "@/data/il-ilce";
import type { CmsRepresentative } from "@/lib/cms";

const provinces = Object.keys(IL_ILCE);

export function TemsilciliklerimizForm({ representatives = [] }: { representatives?: CmsRepresentative[] }) {
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [searched, setSearched] = useState(false);

  const districts = il ? IL_ILCE[il] : [];
  const canSearch = Boolean(il && ilce);

  const matches = representatives.filter(
    (r) => r.province.localeCompare(il, "tr", { sensitivity: "base" }) === 0 && r.district.localeCompare(ilce, "tr", { sensitivity: "base" }) === 0
  );

  const handleFind = () => {
    if (!canSearch) return;
    setSearched(true);
  };

  const handleOpenMaps = () => {
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
            setSearched(false);
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
          onChange={(e) => {
            setIlce(e.target.value);
            setSearched(false);
          }}
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

      {searched && (
        <div className="mt-2 flex flex-col gap-y-3">
          {matches.length > 0 ? (
            matches.map((r) => (
              <Link
                key={r.id}
                href={`/temsilci/${r.id}`}
                className="rounded border border-gray-200 p-4 transition-colors hover:border-vf-red hover:bg-gray-50"
              >
                <p className="text-sm font-bold text-black">{r.businessName}</p>
                <p className="mt-1 text-xs text-gray-600">{r.address}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-600">
              {ilce} ilçesinde kayıtlı bir temsilcilik bulunamadı. Haritada yakınındaki mağazaları arayabilirsin.
            </p>
          )}
          <button
            type="button"
            onClick={handleOpenMaps}
            className="text-left text-sm font-bold text-vf-red hover:underline"
          >
            Haritada ara →
          </button>
        </div>
      )}
    </div>
  );
}
