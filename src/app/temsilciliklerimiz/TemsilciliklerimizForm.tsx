"use client";

import { useState } from "react";

const provinces = [
  "ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AKSARAY", "AMASYA", "ANKARA", "ANTALYA",
  "ARDAHAN", "ARTVİN", "AYDIN", "BALIKESİR", "BARTIN", "BATMAN", "BAYBURT", "BİLECİK",
  "BİNGÖL", "BİTLİS", "BOLU", "BURDUR", "BURSA", "ÇANAKKALE", "ÇANKIRI", "ÇORUM",
  "DENİZLİ", "DİYARBAKIR", "DÜZCE", "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", "ESKİŞEHİR",
  "GAZİANTEP", "GİRESUN", "GÜMÜŞHANE", "HAKKARİ", "HATAY", "IĞDIR", "ISPARTA", "İSTANBUL",
  "İZMİR", "KAHRAMANMARAŞ", "KARABÜK", "KARAMAN", "KARS", "KASTAMONU", "KAYSERİ", "KİLİS",
  "KIRIKKALE", "KIRKLARELİ", "KIRŞEHİR", "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA",
  "MARDİN", "MERSİN", "MUĞLA", "MUŞ", "NEVŞEHİR", "NİĞDE", "ORDU", "OSMANİYE",
  "RİZE", "SAKARYA", "SAMSUN", "ŞANLIURFA", "SİİRT", "SİNOP", "SİVAS", "ŞIRNAK",
  "TEKİRDAĞ", "TOKAT", "TRABZON", "TUNCELİ", "UŞAK", "VAN", "YALOVA", "YOZGAT", "ZONGULDAK",
];

export function TemsilciliklerimizForm() {
  const [il, setIl] = useState("");

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-y-4 rounded-lg bg-white p-6 shadow-md">
      <div className="flex flex-col gap-y-2">
        <label htmlFor="il" className="text-sm font-bold text-black">
          İl
        </label>
        <select
          id="il"
          value={il}
          onChange={(e) => setIl(e.target.value)}
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
          disabled={!il}
          className="rounded border border-gray-300 px-4 py-3 text-sm text-black disabled:bg-gray-100 disabled:text-gray-400 focus:border-vf-red focus:outline-none"
        >
          <option value="">İlçe seçiniz</option>
        </select>
      </div>

      <button
        type="button"
        className="mt-2 rounded bg-vf-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
      >
        Bul
      </button>
    </div>
  );
}
