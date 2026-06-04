"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge, Button, Card, Logo } from "@casax/ui";
import { ApiError, recoverFromUnauthorized } from "@/services/api";
import { getCurrentUser, logout } from "@/services/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Landlords", href: "/landlords", icon: Users },
  { label: "Property setup", href: "/property-setup", icon: Building2 },
  { label: "Vacancy publishing", href: "/vacancy-publishing", icon: Building2 },
  { label: "Inspection queue", href: "/inspections", icon: CalendarDays },
  { label: "Application queue", href: "/applications", icon: ListChecks },
  { label: "Residents", href: "/residents", icon: Users },
  { label: "Payments & remittances", href: "/payments", icon: CreditCard },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Activity logs", href: "/activity", icon: Activity },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (
      currentUser.error instanceof ApiError &&
      currentUser.error.isAuthenticationError
    ) {
      queryClient.clear();
      void recoverFromUnauthorized(currentUser.error);
    }
  }, [currentUser.error, queryClient]);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace(`${APP_URL}/auth/login`);
  };

  if (currentUser.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md border-slate-200 p-8 text-center shadow-xl shadow-slate-200/40">
          <Logo />
          <div className="mx-auto mt-8 h-2 w-32 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-orange-500" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-slate-950">
            Verifying admin access
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            CasaX is confirming your internal operations session.
          </p>
        </Card>
      </div>
    );
  }

  if (currentUser.data?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <Logo />
          <h1 className="mt-8 text-xl font-semibold text-slate-950">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This console is reserved for CasaX internal operations.
          </p>
          <Button className="mt-7 w-full" onClick={handleLogout}>
            Continue to sign in
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="hidden h-screen w-64 flex-none overflow-y-auto border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Logo />
        <Badge className="mt-7 w-fit bg-orange-50 text-orange-700">
          Internal admin
        </Badge>
        <nav className="mt-7 space-y-1">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                pathname === href ||
                pathname.startsWith(`${href}/`) ||
                (href === "/vacancy-publishing" &&
                  pathname.startsWith("/vacancies"))
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              href={href}
              key={href}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-50 flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden items-center gap-2 text-sm font-medium lg:flex">
            <ShieldCheck className="size-4 text-emerald-600" />
            Platform operations
          </div>
          <div className="flex items-center gap-4">
            <button
              className="relative text-slate-600"
              aria-label="Admin notifications"
            >
              <Bell className="size-5" />
              <span className="absolute -right-1 -top-1 size-2 rounded-full bg-orange-500" />
            </button>
            <button
              aria-label="Sign out"
              className="text-slate-600 transition hover:text-slate-950"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </header>
        <div className="flex-none border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex gap-2 overflow-x-auto">
            {navigation.slice(0, 5).map(({ label, href }) => (
              <Link
                className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
