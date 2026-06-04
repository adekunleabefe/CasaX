"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import { Badge, Button, Card, Logo } from "@casax/ui";
import { ApiError, recoverFromUnauthorized } from "@/lib/api";
import { useCurrentApplicant } from "@/lib/applicant-queries";
import { logout } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.casax.ng";

export function AccountShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const currentUser = useCurrentApplicant();
  const profile = currentUser.data?.profile;
  const fullName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
    "CasaX user";
  const initials = getInitials(fullName, currentUser.data?.email);

  useEffect(() => {
    if (
      currentUser.error instanceof ApiError &&
      currentUser.error.isAuthenticationError
    ) {
      void recoverFromUnauthorized(currentUser.error);
    }
  }, [currentUser.error]);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace("/auth/sign-in");
  };

  if (currentUser.isPending) {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <Logo />
          <div className="mx-auto mt-8 h-2 w-32 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-slate-950">
            Opening your account
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            CasaX is confirming your account access.
          </p>
        </Card>
      </main>
    );
  }

  if (currentUser.data?.role === "tenant") {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <Logo />
          <h1 className="mt-8 text-xl font-semibold text-slate-950">
            Continue in the Resident Portal
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your CasaX account has resident access. Lease, rent, receipts,
            renewals, and maintenance now live in the CasaX resident workspace.
          </p>
          <Button className="mt-7 w-full" asChild>
            <Link href={`${APP_URL}/dashboard`}>Open Resident Portal</Link>
          </Button>
        </Card>
      </main>
    );
  }

  if (currentUser.data?.role !== "applicant") {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <Logo />
          <h1 className="mt-8 text-xl font-semibold text-slate-950">
            CasaX account required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Use a CasaX account to save rentals, book inspections, and
            track applications on CasaX.
          </p>
          <Button className="mt-7 w-full" onClick={handleLogout}>
            Sign in to CasaX
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <AccountHero
          email={currentUser.data?.email ?? ""}
          fullName={fullName}
          initials={initials}
        />
        <AccountTabs pathname={pathname} />
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}

function AccountHero({
  email,
  fullName,
  initials,
}: {
  email: string;
  fullName: string;
  initials: string;
}) {
  return (
    <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
      <div className="relative p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(15,23,42,0.10),transparent_32%),linear-gradient(135deg,#ffffff,#f8fafc)]" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-semibold text-white shadow-xl shadow-slate-300/70">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-emerald-700">
                  My Rentals
                </p>
                <Badge className="bg-emerald-50 text-emerald-700">
                  CasaX account
                </Badge>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {fullName}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {email || "Your CasaX account email"}
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <p className="text-sm font-medium text-slate-700">
              Continue your rental search from verified listings.
            </p>
            <Button className="mt-4 w-full rounded-2xl" asChild>
              <Link href="/rentals">Browse rentals</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function AccountTabs({ pathname }: { pathname: string }) {
  const tabs = [
    { label: "Overview", href: "/applicant", icon: LayoutDashboard },
    { label: "Saved rentals", href: "/applicant/saved-rentals", icon: Bookmark },
    {
      label: "Inspections",
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
    <nav
      aria-label="CasaX account navigation"
      className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-200/50"
    >
      <div className="flex min-w-max gap-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href !== "/applicant" && pathname.startsWith(`${href}/`));
          return (
            <Link
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
              href={href}
              key={href}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getInitials(name: string, email?: string) {
  const words = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words.length === 1 && words[0] !== "CasaX") {
    return words[0].slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() ?? "CX";
}
