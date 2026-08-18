"use client";

import { useState } from "react";

export interface LimitTable {
  title: string;
  rows: [string, string, string, string][];
}

/**
 * RFP feedback 5.0 (fallback masking audit): the hardcoded fallback arrays
 * that used to back this section (when the CMS's fee-rows/limit-tables
 * collections were empty) were removed — same reasoning as the
 * ContentUnavailable pattern used by kampanyalar/blog: an editor building
 * this section from scratch in the CMS should see an honest empty table,
 * not silently-substituted placeholder numbers they'd have to notice and
 * clear out themselves. Both props are required now; the caller
 * (ucretler-ve-limitler/page.tsx) is what decides whether to render this at
 * all vs. an empty/error state.
 */
export function PricesAndLimits({
  feeRows,
  limitTables,
}: {
  feeRows: [string, string][];
  limitTables: LimitTable[];
}) {
  const [tab, setTab] = useState<"ucretler" | "limitler">("ucretler");

  return (
    <section className="mx-auto max-w-[1030px] px-4 py-16">
      <div className="flex w-full max-w-[300px] items-center gap-x-2 rounded-lg bg-vf-gray p-1">
        <button
          type="button"
          onClick={() => setTab("ucretler")}
          className={`w-full rounded-md py-2.5 text-sm font-bold transition-colors ${
            tab === "ucretler" ? "bg-white text-black shadow-sm" : "text-gray-500"
          }`}
        >
          Ücretler
        </button>
        <button
          type="button"
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
                  {table.rows.map((row) => (
                    <tr key={row.join("|")} className="border-b border-gray-200">
                      {row.map((cell, j) => (
                        <td key={`${row[0]}-${row[1]}-${cell}`} className={`py-3 pr-4 ${j === 0 ? "font-bold text-black" : "text-gray-600"}`}>
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
