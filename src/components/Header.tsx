"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon, CloseIcon, MenuIcon } from "@/components/icons";
import type { NavLink } from "@/types/homepage";

const navLinks: NavLink[] = [
  { label: "Ürünler", href: "/vodafone-pay-uygulama" },
  { label: "Kampanyalar", href: "/kampanyalar" },
  { label: "Blog", href: "/blog" },
  { label: "Ücretler ve Limitler", href: "/ucretler-ve-limitler" },
  { label: "Sıkça Sorulan Sorular", href: "/sikca-sorulan-sorular" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky -top-px z-[999] bg-white">
      <div className="flex items-center justify-between px-4 py-3 shadow-md lg:hidden">
        <button
          aria-label="Menüyü aç"
          className="rounded-md p-2 transition-colors hover:bg-gray-100"
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <Link href="/">
          <Image src="/images/vpay-logo.svg" alt="Vodafone Pay Logo" width={139} height={42} priority />
        </Link>
      </div>

      <div className="hidden items-center justify-between px-8 py-3 lg:flex">
        <Link href="/">
          <Image src="/images/vpay-logo.svg" alt="Vodafone Pay Logo" width={139} height={42} priority />
        </Link>
        <nav className="flex items-center gap-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-base text-black transition-colors hover:text-[#e60000]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setMenuOpen(false)}
          />
          <button
            aria-label="Menüyü kapat"
            className="absolute right-4 top-20 z-50 rounded-md bg-black p-3 text-white shadow-lg transition-colors hover:bg-gray-100"
            onClick={() => setMenuOpen(false)}
          >
            <CloseIcon className="h-6 w-6" />
          </button>
          <div
            style={{ width: "80%" }}
            className="absolute left-0 top-0 h-full overflow-y-auto bg-white shadow-xl"
          >
            <div className="px-4 pb-4 pt-20">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="mb-2 flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 text-left text-lg font-normal transition-colors hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{link.label}</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
