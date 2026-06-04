"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Bookmark,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react";
import { Button, Logo } from "@casax/ui";
import { MobileMenu } from "@/components/mobile-menu";
import { useCurrentApplicant } from "@/lib/applicant-queries";
import { logout } from "@/lib/auth";

const APP_LOGIN_URL = `${(
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.casax.ng"
).replace(/\/$/, "")}/auth/login`;

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUser = useCurrentApplicant();
  const isApplicant = currentUser.data?.role === "applicant";
  const profile = currentUser.data?.profile;
  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "CasaX user";
  const initials = getInitials(fullName, currentUser.data?.email);

  async function handleSignOut() {
    await logout();
    queryClient.clear();
    setIsMenuOpen(false);
    router.replace("/");
    router.refresh();
  }

  const isAuthPage = pathname?.startsWith("/auth");

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-[80] border-b border-slate-200/70 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/78">
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" aria-label="CasaX home">
            <Logo className="text-slate-950" />
          </Link>
          <Button
            className="h-11 rounded-full border-slate-200 bg-white px-5 text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
            variant="outline"
            asChild
          >
            <Link href="/">Back to rentals</Link>
          </Button>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-[80] border-b border-slate-200/70 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/78">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" aria-label="CasaX home">
          <Logo className="text-slate-950" />
        </Link>
        <div className="hidden flex-1 lg:block" />
        <div className="hidden items-center gap-3 lg:flex">
          {isApplicant ? (
            <>
              <button
                aria-label="CasaX account notifications"
                className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                type="button"
              >
                <Bell className="size-4" />
              </button>
              <div
                className="relative"
                onMouseEnter={() => setIsMenuOpen(true)}
                ref={dropdownRef}
              >
                <button
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                  className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white pr-3 pl-1.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  type="button"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <span className="max-w-32 truncate">{fullName}</span>
                  <ChevronDown className="size-4 text-slate-400" />
                </button>
                {isMenuOpen ? (
                  <ApplicantDropdown
                    email={currentUser.data?.email ?? ""}
                    fullName={fullName}
                    initials={initials}
                    onNavigate={() => setIsMenuOpen(false)}
                    onSignOut={handleSignOut}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Button
                className="h-11 rounded-full border-slate-200 bg-white px-4 text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                variant="outline"
                asChild
              >
                <Link href={APP_LOGIN_URL}>Login to Resident Portal</Link>
              </Button>
              <Button
                className="h-11 rounded-full border-slate-200 bg-white px-5 text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                variant="outline"
                asChild
              >
                <Link href="/auth/sign-in">Login</Link>
              </Button>
              <Button
                className="h-11 rounded-full bg-emerald-50 px-5 text-emerald-800 shadow-sm hover:bg-emerald-100"
                variant="ghost"
                asChild
              >
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
          <Button
            className="h-11 rounded-full bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
            asChild
          >
            <Link href="/property-owners#assessment">Talk to CasaX</Link>
          </Button>
        </div>
        <MobileMenu
          isAuthenticated={isApplicant}
          onSignOut={handleSignOut}
        />
      </nav>
    </header>
  );
}

function ApplicantDropdown({
  email,
  fullName,
  initials,
  onNavigate,
  onSignOut,
}: {
  email: string;
  fullName: string;
  initials: string;
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  const items = [
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
    <div
      className="absolute right-0 top-14 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_70px_-28px_rgba(15,23,42,0.45)]"
      role="menu"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
        <span className="flex size-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {fullName}
          </p>
          <p className="truncate text-xs text-slate-500">{email}</p>
        </div>
      </div>
      <div className="p-2">
        <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          CasaX account
        </p>
        {items.map(({ href, icon: Icon, label }) => (
          <Link
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            href={href}
            key={label}
            onClick={onNavigate}
            role="menuitem"
          >
            <Icon className="size-4 text-slate-400" />
            {label}
          </Link>
        ))}
        <button
          className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
          onClick={onSignOut}
          type="button"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function getInitials(name: string, email?: string) {
  const words = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words.length === 1 && words[0] !== "CasaX user") {
    return words[0].slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() ?? "AX";
}
