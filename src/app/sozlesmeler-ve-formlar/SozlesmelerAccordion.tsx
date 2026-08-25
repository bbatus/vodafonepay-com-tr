"use client";

import { useState } from "react";
import Link from "next/link";

export type SozlesmeDoc = { label: string; href: string; external: boolean };
export type SozlesmeGroup = { label: string; documents: SozlesmeDoc[] };

/**
 * Mirrors the live vodafonepay.com.tr/sozlesmeler-ve-formlar layout: each
 * document group is a collapsible panel ("Sözleşmeler ve Formlar",
 * "Seslendirilmiş Sözleşme ve Formlar", …) with its links inside. The first
 * group starts open, matching the real page.
 *
 * A row links to one of two places depending on how the editor created it (see
 * LegalPages.ts's `source` field): an uploaded PDF opens in a new tab, while a
 * page written in the CMS is an ordinary internal route, so it stays on our own
 * domain and gets prefetched like any other link.
 */
export function SozlesmelerAccordion({ groups }: { groups: SozlesmeGroup[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mt-10 flex flex-col gap-y-4">
      {groups.map((group, i) => {
        const open = openIndex === i;
        return (
          <div key={group.label} className="overflow-hidden rounded bg-white shadow-[0px_2px_8px_0px_#00000029]">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? -1 : i)}
              className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-bold text-black"
            >
              {group.label}
              <span aria-hidden className={`text-vf-red transition-transform ${open ? "rotate-180" : ""}`}>
                ⌄
              </span>
            </button>

            {open && (
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
                <ul className="flex flex-col gap-y-4">
                  {group.documents.map((doc) => (
                    <li key={doc.href} className="text-sm leading-6 text-gray-800">
                      {doc.external ? (
                        <a
                          href={doc.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vf-red underline underline-offset-2 hover:text-red-700"
                        >
                          {doc.label}
                        </a>
                      ) : (
                        <Link href={doc.href} className="text-vf-red underline underline-offset-2 hover:text-red-700">
                          {doc.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
