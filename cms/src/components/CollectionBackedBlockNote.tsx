"use client";

import Link from "next/link";
import { useAdminLocale } from "./useAdminLocale";

/**
 * Some blocks deliberately carry no content fields because their data already
 * lives in a collection (Fees and Limits pulls Fee Rows + Limit Tables, the
 * same way `faqList` pulls FAQ Items). Payload renders such a block as an
 * empty panel, which reads as "broken" rather than "nothing to fill in here",
 * so this UI field explains where the content actually comes from and links
 * straight to it.
 */
const STRINGS = {
  tr: {
    title: "Bu bloğun doldurulacak alanı yok.",
    body: "İçeriği ayrı koleksiyonlardan gelir — burada bir şey yazmanız gerekmez. Sayfaya eklemeniz yeterli; rakamları düzenlemek için:",
    fees: "Ücret Tablosu",
    limits: "Limit Tabloları",
  },
  en: {
    title: "This block has no fields to fill in.",
    body: "Its content comes from separate collections — you don't type anything here. Just add it to the page; to edit the numbers go to:",
    fees: "Fee Rows",
    limits: "Limit Tables",
  },
};

export default function CollectionBackedBlockNote() {
  const t = STRINGS[useAdminLocale()];

  return (
    <div
      style={{
        background: "var(--theme-elevation-50)",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: 4,
        padding: "12px 16px",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <strong>{t.title}</strong>
      <div style={{ marginTop: 4 }}>
        {t.body}{" "}
        <Link href="/admin/collections/fee-rows">{t.fees}</Link>
        {" · "}
        <Link href="/admin/collections/limit-tables">{t.limits}</Link>
      </div>
    </div>
  );
}
