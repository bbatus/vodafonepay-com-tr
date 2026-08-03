import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

export function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="breadcrumb" className="mx-auto max-w-[1030px] px-4 py-4 text-sm text-gray-500">
      <ol className="flex items-center gap-x-2">
        <li>
          <Link href="/" className="hover:text-black">
            Ana Sayfa
          </Link>
        </li>
        <li>
          <ChevronRightIcon className="h-3 w-3" stroke="currentColor" />
        </li>
        <li className="text-black">{current}</li>
      </ol>
    </nav>
  );
}
