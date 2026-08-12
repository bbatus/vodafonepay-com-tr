import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

export interface CardListItem {
  image: string;
  title: string;
  description?: string;
  href?: string;
  category?: string;
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
        {items.map((item) => {
          const cardClassName = "w-full max-w-[361px] cursor-pointer overflow-hidden rounded-md bg-white p-5 text-left shadow-md";
          const content = (
            <>
              <Image src={item.image} alt={item.title} width={361} height={240} className="h-[240px] w-full rounded object-cover" />
              <h3 className="mt-4 text-lg font-bold text-black">{item.title}</h3>
              {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
              <span className="mt-2 inline-flex items-center gap-x-1 text-sm font-bold text-vf-red">
                {linkLabel} <ChevronRightIcon className="h-3 w-3" />
              </span>
            </>
          );

          return item.href ? (
            <Link href={item.href} key={item.title} className={cardClassName}>
              {content}
            </Link>
          ) : (
            <button type="button" key={item.title} className={cardClassName}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
