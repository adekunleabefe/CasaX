"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@casax/ui";

const links = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Rentals", href: "/rentals" },
  { label: "For Landlords", href: "/#landlords" },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {isOpen && (
        <div className="absolute inset-x-4 top-[76px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.34)] sm:right-5 sm:left-auto sm:w-80">
          <nav className="space-y-1" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                href={link.href}
                key={link.label}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
            <Button className="w-full rounded-xl" variant="outline" asChild>
              <Link href="/auth" onClick={() => setIsOpen(false)}>
                Login
              </Link>
            </Button>
            <Button className="w-full rounded-xl" asChild>
              <Link
                href="https://app.casax.ng/auth/register"
                onClick={() => setIsOpen(false)}
              >
                Get started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
