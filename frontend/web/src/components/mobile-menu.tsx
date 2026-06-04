"use client";

import Link from "next/link";
import {
  Bookmark,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@casax/ui";

const APP_LOGIN_URL = `${(
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.casax.ng"
).replace(/\/$/, "")}/auth/login`;

export function MobileMenu({
  isAuthenticated = false,
  onSignOut,
}: {
  isAuthenticated?: boolean;
  onSignOut?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const applicantLinks = [
    { label: "Overview", href: "/applicant", icon: LayoutDashboard },
    { label: "Saved rentals", href: "/applicant/saved-rentals", icon: Bookmark },
    {
      label: "Inspection bookings",
      href: "/applicant/inspections",
      icon: CalendarDays,
    },
    {
      label: "Applications",
      href: "/applicant/applications",
      icon: ClipboardCheck,
    },
    { label: "Profile", href: "/applicant/profile", icon: UserRound },
  ];

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
          <nav className="sr-only" aria-label="Mobile navigation" />
          {isAuthenticated ? (
            <div>
              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                CasaX account
              </p>
              <div className="space-y-1">
                {applicantLinks.map(({ href, icon: Icon, label }) => (
                  <Link
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    href={href}
                    key={label}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="size-4 text-slate-400" />
                    {label}
                  </Link>
                ))}
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  onClick={() => {
                    setIsOpen(false);
                    onSignOut?.();
                  }}
                  type="button"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
              <Button
                className="h-11 w-full rounded-full"
                variant="outline"
                asChild
              >
                <Link href={APP_LOGIN_URL} onClick={() => setIsOpen(false)}>
                  Login to Resident Portal
                </Link>
              </Button>
              <Button
                className="h-11 w-full rounded-full"
                variant="outline"
                asChild
              >
                <Link href="/auth/sign-in" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              </Button>
              <Button
                className="h-11 w-full rounded-full"
                variant="outline"
                asChild
              >
                <Link href="/auth/sign-up" onClick={() => setIsOpen(false)}>
                  New to CasaX? Create account
                </Link>
              </Button>
              <Button className="h-11 w-full rounded-full" asChild>
                <Link
                  href="/property-owners#assessment"
                  onClick={() => setIsOpen(false)}
                >
                  Talk to CasaX
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
