import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

/**
 * `trail` is the Butterfly-parity gap-fill for Pages' `parent` reference
 * (docs/RFP-OPEN-ITEMS.md §8) — an optional chain of intermediate crumbs
 * between "Ana Sayfa" and `current` (e.g. a parent Page's title/href).
 * Every other caller of this component omits it and keeps today's
 * two-crumb behavior.
 */
export function Breadcrumb({ current, trail }: { current: string; trail?: { label: string; href: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="mx-auto max-w-[1030px] px-4 py-4 text-sm text-gray-500">
      <ol className="flex items-center gap-x-2">
        <li>
          <Link href="/" className="hover:text-black">
            Ana Sayfa
          </Link>
        </li>
        {(trail ?? []).map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-x-2">
            <ChevronRightIcon className="h-3 w-3" stroke="currentColor" />
            <Link href={crumb.href} className="hover:text-black">
              {crumb.label}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-x-2">
          <ChevronRightIcon className="h-3 w-3" stroke="currentColor" />
          <span className="text-black">{current}</span>
        </li>
      </ol>
    </nav>
  );
}
