import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

export interface CardListItem {
  /** Stable identity for React's key — falls back to `title` only when the source has no real id (e.g. hardcoded fallback content). */
  id?: string;
  image: string;
  title: string;
  description?: string;
  href?: string;
  category?: string;
  /** Per-card override for the CTA text (e.g. campaign.ctaLabel from the CMS) — falls back to the grid's shared `linkLabel` when unset. */
  linkLabel?: string;
}

/**
 * Split out of CardListGrid so the CMS's single-campaign preview page
 * (kampanyalar/[slug]/kart-onizleme) can render the exact same card markup
 * the real listing page uses — no separate copy to drift out of sync.
 */
export function CardListCard({ item, linkLabel = "Detayları gör" }: { item: CardListItem; linkLabel?: string }) {
  const cardClassName = "w-full max-w-[361px] cursor-pointer overflow-hidden rounded-md bg-white p-5 text-left shadow-md";
  const label = item.linkLabel || linkLabel;
  const content = (
    <>
      <Image src={item.image} alt={item.title} width={361} height={240} className="h-[240px] w-full rounded object-cover" />
      <h3 className="mt-4 text-lg font-bold text-black">{item.title}</h3>
      {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
      <span className="mt-2 inline-flex items-center gap-x-1 text-sm font-bold text-vf-red">
        {label} <ChevronRightIcon className="h-3 w-3" />
      </span>
    </>
  );

  return item.href ? (
    <Link href={item.href} className={cardClassName}>
      {content}
    </Link>
  ) : (
    <button type="button" className={cardClassName}>
      {content}
    </button>
  );
}

export function CardListGrid({
  title,
  items,
  linkLabel = "Detayları gör",
}: {
  title: string;
  items: CardListItem[];
  linkLabel?: string;
}) {
  return (
    <div className="mt-8 lg:ml-8">
      <h2 className="text-center text-2xl font-bold lg:text-left lg:text-[28px]">{title}</h2>
      <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-10 lg:grid-cols-3">
        {items.map((item) => (
          <CardListCard key={item.id ?? item.title} item={item} linkLabel={linkLabel} />
        ))}
      </div>
    </div>
  );
}
