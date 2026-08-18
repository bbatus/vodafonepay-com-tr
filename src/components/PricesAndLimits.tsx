"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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
 *
 * Colors below were read off the live vodafonepay.com.tr computed styles,
 * not guessed: header row #f2f2f2, body rows alternate #fafafa/#fff, the
 * limit table's "Kimlik doğrulama yapılmış" column is always #e60000/white
 * (header and body, not just the header), and its "Periyot" values are
 * #008a00 green.
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
        <div className="mt-8 overflow-x-auto rounded-lg">
          <table className="w-full border-collapse text-left text-sm">
            {/* Live site's fee table header row has no text, just the #f2f2f2
                bar — matched exactly, not guessed. */}
            <thead>
              <tr className="bg-[#f2f2f2]">
                <th className="py-5 pl-4 pr-6" aria-hidden="true"></th>
                <th className="py-5 pr-4" aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {feeRows.map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? "bg-[#fafafa]" : "bg-white"}>
                  <td className="py-4 pl-4 pr-6 font-bold text-black">{label}</td>
                  <td className="whitespace-pre-line py-4 pr-4 text-[#333]">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-y-10">
          {limitTables.map((table) => (
            <div key={table.title} className="overflow-x-auto rounded-lg">
              <h2 className="mb-4 text-xl font-bold text-black">{table.title}</h2>
              <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#f2f2f2]">
                    <th className="py-4 pl-4 pr-4 font-bold text-black"></th>
                    <th className="py-4 pr-4 font-normal text-black">Periyot</th>
                    <th className="py-4 pr-4 font-normal text-black">Doğrulama yapmamış</th>
                    <th className="bg-[#e60000] py-4 pr-4 font-normal text-white">Kimlik doğrulama yapılmış</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => {
                    const rowBg = i % 2 === 0 ? "bg-[#fafafa]" : "bg-white";
                    return (
                      <tr key={row.join("|")}>
                        <td className={cn("py-3 pl-4 pr-4 font-bold text-black", rowBg)}>{row[0]}</td>
                        <td className={cn("py-3 pr-4 text-[#008a00]", rowBg)}>{row[1]}</td>
                        <td className={cn("py-3 pr-4 text-black", rowBg)}>{row[2]}</td>
                        <td className="bg-[#e60000] py-3 pr-4 text-white">{row[3]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
