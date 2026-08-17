import { CalendarIcon } from "@/components/icons";

/**
 * RFP feedback 5.3 — "Kampanya Tarihi 14.07.2026 - 15.08.2026 … kampanya
 * kartının altında tutmuşlar".
 *
 * Checked against the live vodafonepay.com.tr first: the real site renders
 * this on the campaign DETAIL page (calendar glyph + "Kampanya Tarihi" +
 * `dd.mm.yyyy - dd.mm.yyyy`, sitting directly under the campaign card block
 * and above the "Kampanya Detay" heading) — its listing cards carry no date
 * at all. We render it in BOTH places because the brief asks for it on the
 * card too; this component is the single definition so the two can't drift
 * into different labels or date formats.
 *
 * Renders nothing at all when neither date is set — an empty "Kampanya
 * Tarihi" line with nothing after it is worse than no line, and it would
 * also knock the listing grid's cards out of alignment.
 */
export function CampaignDate({
  startDate,
  endDate,
  className = "",
}: {
  startDate?: string;
  endDate?: string;
  className?: string;
}) {
  if (!startDate && !endDate) return null;

  const format = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

  let range: string;
  if (startDate && endDate) {
    range = `${format(startDate)} - ${format(endDate)}`;
  } else if (startDate) {
    // Open-ended campaigns read as a start, not as a half-empty range.
    range = `${format(startDate)} tarihinden itibaren`;
  } else {
    range = `${format(endDate as string)} tarihine kadar`;
  }

  return (
    <p className={`flex items-center gap-x-2 text-sm text-gray-600 ${className}`}>
      <CalendarIcon className="h-4 w-4 shrink-0 text-vf-red" />
      <span>
        <span className="font-bold">Kampanya Tarihi</span> {range}
      </span>
    </p>
  );
}
