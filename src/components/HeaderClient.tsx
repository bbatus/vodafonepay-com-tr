"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon, CloseIcon, MenuIcon } from "@/components/icons";
import type { NavLink } from "@/types/homepage";

export function HeaderClient({
  productLinks,
  navLinks,
}: {
  productLinks: NavLink[];
  navLinks: NavLink[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  return (
    <header className="sticky -top-px z-[999] bg-white">
      <div className="flex items-center justify-between px-4 py-3 shadow-md lg:hidden">
        <button
          type="button"
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

      <div className="mx-auto hidden max-w-4xl items-center gap-x-8 py-6 lg:flex">
        <Link href="/">
          <Image src="/images/vpay-logo.svg" alt="Vodafone Pay Logo" width={139} height={42} priority />
        </Link>
        <nav className="flex items-center gap-x-8">
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button type="button" className="text-xl font-normal text-black transition-colors hover:text-vf-red">
              Ürünler
            </button>
            {productsOpen && (
              <div className="absolute left-0 top-full w-64 rounded-md bg-white py-2 shadow-lg">
                {productLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-base text-black transition-colors hover:bg-gray-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xl font-normal text-black transition-colors hover:text-vf-red"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setMenuOpen(false)}
          />
          <button
            type="button"
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
              <button
                type="button"
                onClick={() => setMobileProductsOpen((v) => !v)}
                className="mb-2 flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 text-left text-lg font-normal transition-colors hover:bg-gray-50"
              >
                <span>Ürünler</span>
                <ChevronRightIcon className={`h-5 w-5 transition-transform ${mobileProductsOpen ? "rotate-90" : ""}`} />
              </button>
              {mobileProductsOpen && (
                <div className="mb-2 flex flex-col gap-y-1 pl-4">
                  {productLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.mobileHref || link.href}
                      className="rounded px-4 py-2 text-base text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.mobileHref || link.href}
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
