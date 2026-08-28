import type { CmsRepresentative } from "@/lib/cms";

/**
 * The live site's `widget_Representatives` (/temsilciliklerimiz), reduced to
 * the part that makes sense on an arbitrary page: the directory listing.
 *
 * The hand-written /temsilciliklerimiz route keeps its province/district
 * search form (TemsilciliklerimizForm) — that is a whole page's worth of UI
 * and does not belong dropped into the middle of someone's landing page. This
 * block is the list itself, optionally capped, so an editor can show "our
 * representatives" as one section among others.
 */
export function RepresentativeList({
  representatives,
  heading,
  limit,
}: {
  representatives: CmsRepresentative[];
  heading?: string;
  limit?: number;
}) {
  const shown = limit && limit > 0 ? representatives.slice(0, limit) : representatives;
  if (shown.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1030px] px-4 py-16">
      {heading && <h2 className="mb-8 text-2xl font-bold text-black lg:text-4xl">{heading}</h2>}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => (
          <div key={r.id} className="flex flex-col gap-y-2 rounded-md bg-vf-gray p-5">
            <span className="text-lg font-bold leading-7 text-black">{r.businessName}</span>
            <span className="text-base text-[#333]">{r.address}</span>
            <span className="text-base text-black/70">
              {r.district}
              {r.district && r.province ? " / " : ""}
              {r.province}
            </span>
            {r.phone && <span className="text-base text-[#333]">{r.phone}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
