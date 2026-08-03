"use client";

import { useState } from "react";

const feeRows: [string, string][] = [
  ["Faturana Yansıt Hizmet Bedeli", "Aylık 31,90 TL olarak tahsil edilir."],
  [
    "Faturana Yansıt Geç Tahsilat Bedeli",
    "0-30 gün gecikme: 200 TL'ye kadar 65,9 TL, 200 TL ve üzeri için 99,9 TL. 30 gün ve üzeri gecikme: 200 TL'ye kadar 109,9 TL, 200 TL ve üzeri için 119,9 TL.",
  ],
  ["Anında Bakiye İşlem Ücreti", "Kullanılan tutarın %10'u"],
  ["QR ile Faturana Yansıt İşlem Ücreti", "Kullanılan tutarın %3'ü"],
  ["Vodafone Pay Fiziksel Kart", "Tavsiye edilen satış fiyatı 19,90 TL"],
  ["Aylık Vodafone Pay Kart kullanım ücreti", "Ücretsiz"],
  ["Fatura Ödeme", "Ücretsiz"],
  ["Ulaşım Kartı Bakiye Yükleme", "Ücretsiz"],
  ["Kolay Paket Satın Alımı", "Ücretsiz"],
  ["ATM Bakiye Sorgulama", "Ücretsiz"],
  ["Para Yükleme (tüm ATM'ler)", "Ücretsiz"],
  ["Para Yükleme (kart numarasına EFT)", "Ücretsiz"],
  ["Banka Kartı / Debit Kart ile Yükleme Ücreti", "Ücretsiz"],
  ["Kredi Kartı ile Yükleme Ücreti", "Yüklenen tutar üzerinden %3,5 ücret alınır."],
  ["Yurt içindeki ATM'lerden Para Çekme", "Ücretsiz"],
  ["Yurt dışındaki ATM'lerden Para Çekme", "Ücretsiz"],
];

interface LimitTable {
  title: string;
  rows: [string, string, string, string][];
}

const limitTables: LimitTable[] = [
  {
    title: "Ön Ödemeli Kart / ATM Limitleri",
    rows: [
      ["Ön Ödemeli Kart", "Günlük", "₺2.000", "₺75.000"],
      ["Ön Ödemeli Kart", "Aylık", "₺2.000", "₺75.000"],
      ["Ön Ödemeli Kart", "Yıllık", "₺24.000", "₺900.000"],
      ["ATM'den para çekme", "Günlük", "Ücretsiz", "₺25.000"],
      ["ATM'den para çekme", "Aylık", "Ücretsiz", "₺25.000"],
      ["ATM'den para çekme", "Yıllık", "Ücretsiz", "₺300.000"],
      ["ATM'den para yatırma", "Günlük", "₺1.250", "₺50.000"],
      ["ATM'den para yatırma", "Aylık", "₺1.250", "₺50.000"],
      ["ATM'den para yatırma", "Yıllık", "₺15.000", "₺600.000"],
    ],
  },
  {
    title: "Cüzdan Limitleri",
    rows: [
      ["Cüzdan", "Günlük", "₺750", "₺25.000"],
      ["Cüzdan", "Aylık", "₺750", "₺25.000"],
      ["Cüzdan", "Yıllık", "₺9.000", "₺300.000"],
    ],
  },
  {
    title: "Faturana Yansıt Limitleri",
    rows: [
      ["Faturana Yansıt", "Tek Seferlik", "₺1.000", "₺2.500"],
      ["Faturana Yansıt", "Aylık", "₺2.750", "₺6.500"],
    ],
  },
];

export function PricesAndLimits() {
  const [tab, setTab] = useState<"ucretler" | "limitler">("ucretler");

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <div className="flex w-full max-w-[300px] items-center gap-x-2 rounded-lg bg-vf-gray p-1">
        <button
          onClick={() => setTab("ucretler")}
          className={`w-full rounded-md py-2.5 text-sm font-bold transition-colors ${
            tab === "ucretler" ? "bg-white text-black shadow-sm" : "text-gray-500"
          }`}
        >
          Ücretler
        </button>
        <button
          onClick={() => setTab("limitler")}
          className={`w-full rounded-md py-2.5 text-sm font-bold transition-colors ${
            tab === "limitler" ? "bg-white text-black shadow-sm" : "text-gray-500"
          }`}
        >
          Limitler
        </button>
      </div>

      {tab === "ucretler" ? (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              {feeRows.map(([label, value]) => (
                <tr key={label} className="border-b border-gray-200">
                  <td className="py-4 pr-6 font-bold text-black">{label}</td>
                  <td className="py-4 text-gray-600">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-y-10">
          {limitTables.map((table) => (
            <div key={table.title} className="overflow-x-auto">
              <h2 className="mb-4 text-xl font-bold text-black">{table.title}</h2>
              <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-3 pr-4 font-bold text-black"></th>
                    <th className="py-3 pr-4 font-bold text-black">Periyot</th>
                    <th className="py-3 pr-4 font-bold text-black">Doğrulama yapmamış</th>
                    <th className="py-3 font-bold text-black">Kimlik doğrulama yapılmış</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      {row.map((cell, j) => (
                        <td key={j} className={`py-3 pr-4 ${j === 0 ? "font-bold text-black" : "text-gray-600"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
