"use client";

import { useState } from "react";
import Link from "next/link";

export type SozlesmeDoc = { prefix?: string | null; label: string; href: string; external: boolean };
export type SozlesmeGroup = { label: string; documents: SozlesmeDoc[] };

/**
 * Mirrors the live vodafonepay.com.tr/sozlesmeler-ve-formlar layout: each
 * document group is a collapsible panel ("Sözleşmeler ve Formlar",
 * "Seslendirilmiş Sözleşme ve Formlar", …) with its links inside. The first
 * group starts open, matching the real page.
 *
 * A row is one of two kinds (see LegalPages.ts's `source` field and
 * lib/documentViewer.ts): an uploaded PDF/audio file, which is `external` and
 * links straight at the file's own host so the click leaves this site, or a
 * page written in the CMS, which is an ordinary internal <Link>. `external`
 * rows deliberately use a plain <a> — next/link would try to client-side
 * navigate a cross-origin URL it can't prefetch or route.
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
                  {group.documents.map((doc) => {
                    const linkClass = "text-vf-red underline underline-offset-2 hover:text-red-700";
                    return (
                      <li key={doc.href} className="text-sm leading-6 text-gray-800">
                        {doc.prefix ? <span>{doc.prefix}</span> : null}
                        {doc.external ? (
                          <a href={doc.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                            {doc.label}
                          </a>
                        ) : (
                          <Link href={doc.href} className={linkClass}>
                            {doc.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
