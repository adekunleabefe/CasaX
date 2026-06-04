"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  BarChart3,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileText,
  House,
  KeyRound,
  LayoutDashboard,
  Settings,
  Wrench,
} from "lucide-react";
import { Badge, Button, Card, Logo } from "@casax/ui";
import type { NavigationItem, UserRole } from "@casax/types";
import { useCurrentUser } from "@/features/auth/queries";
import { ApiError, recoverFromUnauthorized } from "@/services/api";
import { logout } from "@/services/auth";

const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002/dashboard";
const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const WEB_ACCOUNT_URL = `${WEB_URL}/applicant`;

const navigation: (NavigationItem & {
  icon: typeof House;
  roles: UserRole[];
  description?: string;
})[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["landlord", "caretaker", "tenant"],
  },
  {
    label: "Portfolio",
    href: "/properties",
    icon: Building2,
    roles: ["landlord"],
  },
  {
    label: "Vacancies",
    href: "/applications",
    icon: ClipboardCheck,
    roles: ["landlord"],
  },
  {
    label: "Residents",
    href: "/tenancies",
    icon: KeyRound,
    roles: ["landlord"],
  },
  {
    label: "Tenancy records",
    href: "/tenancies",
    icon: KeyRound,
    roles: ["caretaker"],
  },
  {
    label: "My home",
    href: "/tenancies",
    icon: KeyRound,
    roles: ["tenant"],
  },
  {
    label: "Rent & payouts",
    href: "/payments",
    icon: CreditCard,
    roles: ["landlord"],
  },
  {
    label: "Rent visibility",
    href: "/payments",
    icon: CreditCard,
    roles: ["caretaker"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["tenant"],
  },
  {
    label: "Payouts",
    href: "/remittances",
    icon: CreditCard,
    roles: ["caretaker"],
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    roles: ["landlord", "caretaker", "tenant"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["landlord"],
  },
  {
    label: "Management package",
    href: "/subscription",
    icon: CreditCard,
    roles: ["landlord"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["landlord", "caretaker", "tenant"],
  },
];

const tenantNavigation: (NavigationItem & { icon: typeof House })[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Home", href: "/tenancies", icon: House },
  { label: "Rent", href: "/payments", icon: CreditCard },
  { label: "Lease", href: "/agreement", icon: FileText },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Support", href: "/support", icon: BellRing },
  { label: "Documents", href: "/documents", icon: KeyRound },
  { label: "Profile", href: "/settings", icon: Settings },
];

const routePolicies: {
  route: string;
  roles: UserRole[];
}[] = [
  {
    route: "/dashboard",
    roles: ["landlord", "caretaker", "tenant"],
  },
  { route: "/rent", roles: ["tenant"] },
  { route: "/agreement", roles: ["tenant"] },
  { route: "/documents", roles: ["tenant"] },
  { route: "/notifications", roles: ["tenant"] },
  { route: "/support", roles: ["tenant"] },
  { route: "/properties", roles: ["landlord"] },
  { route: "/portfolio", roles: ["landlord"] },
  { route: "/units", roles: ["landlord", "caretaker"] },
  { route: "/applications/new", roles: ["caretaker"] },
  { route: "/applications", roles: ["landlord", "caretaker"] },
  { route: "/caretakers", roles: [] },
  { route: "/subscription", roles: ["landlord"] },
  { route: "/tenant-onboarding-requests", roles: ["caretaker"] },
  { route: "/tenancies/new", roles: ["landlord"] },
  { route: "/tenancies", roles: ["landlord", "caretaker", "tenant"] },
  { route: "/occupancy", roles: ["landlord", "caretaker"] },
  { route: "/payments/new", roles: ["caretaker"] },
  { route: "/payments", roles: ["landlord", "caretaker", "tenant"] },
  { route: "/remittances/new", roles: ["caretaker"] },
  { route: "/remittances", roles: ["landlord", "caretaker"] },
  { route: "/maintenance", roles: ["landlord", "caretaker", "tenant"] },
  { route: "/reports", roles: ["landlord"] },
  { route: "/vacancies", roles: ["landlord", "caretaker"] },
  {
    route: "/settings",
    roles: ["landlord", "caretaker", "tenant"],
  },
];

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function canAccessRoute(pathname: string, role?: UserRole) {
  if (!role) return false;

  if (pathname.startsWith("/tenancies/") && pathname.endsWith("/renew")) {
    return role === "landlord";
  }

  if (role === "landlord" && pathname.includes("/caretakers")) {
    return false;
  }

  const policy = routePolicies
    .filter((item) => matchesRoute(pathname, item.route))
    .sort((left, right) => right.route.length - left.route.length)[0];

  return policy ? policy.roles.includes(role) : true;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");
  const currentUser = useCurrentUser(!isAuthRoute);

  useEffect(() => {
    if (
      currentUser.error instanceof ApiError &&
      currentUser.error.isAuthenticationError
    ) {
      queryClient.clear();
      void recoverFromUnauthorized(currentUser.error);
    }
  }, [currentUser.error, queryClient]);

  useEffect(() => {
    if (
      !isAuthRoute &&
      currentUser.isFetchedAfterMount &&
      currentUser.data?.role === "admin"
    ) {
      window.location.replace(ADMIN_URL);
      return;
    }

    if (
      !isAuthRoute &&
      currentUser.isFetchedAfterMount &&
      currentUser.data?.role === "applicant"
    ) {
      window.location.replace(WEB_ACCOUNT_URL);
      return;
    }

    if (
      !isAuthRoute &&
      currentUser.isFetchedAfterMount &&
      currentUser.data?.role &&
      !canAccessRoute(pathname, currentUser.data.role)
    ) {
      router.replace("/dashboard");
    }
  }, [
    currentUser.data?.role,
    currentUser.isFetchedAfterMount,
    isAuthRoute,
    pathname,
    router,
  ]);

  if (isAuthRoute) return children;

  if (currentUser.isPending || !currentUser.isFetchedAfterMount) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md border-slate-200 p-8 text-center shadow-xl shadow-slate-200/40">
          <Logo />
          <div className="mx-auto mt-8 h-2 w-32 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-slate-950">
            Verifying your session
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            CasaX is confirming your workspace access with the server.
          </p>
        </Card>
      </div>
    );
  }

  const currentRole = currentUser.data?.role;

  if (currentRole === "applicant") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <Logo />
          <h1 className="mt-8 text-xl font-semibold text-slate-950">
            Redirecting to your CasaX account
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Applicant accounts now live on casax.ng for saved rentals,
            inspections, and applications.
          </p>
        </Card>
      </div>
    );
  }

  if (currentRole && !canAccessRoute(pathname, currentRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <Logo />
          <h1 className="mt-8 text-xl font-semibold text-slate-950">
            Redirecting workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This area is not available for your CasaX role.
          </p>
        </Card>
      </div>
    );
  }

  const visibleNavigation = currentRole
    ? navigation.filter((item) => item.roles.includes(currentRole))
    : [];

  const roleLabel = currentRole
    ? `${currentRole[0].toUpperCase()}${currentRole.slice(1)} workspace`
    : "Workspace";

  const profile = currentUser.data?.profile;

  const initials = profile
    ? `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase()
    : (currentUser.data?.email.slice(0, 2).toUpperCase() ?? "--");

  const dateLabel = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeZone: "Africa/Lagos",
  }).format(new Date());

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace("/auth/login");
  };

  if (
    currentUser.error instanceof ApiError &&
    currentUser.error.isAuthenticationError
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-md text-center">
          <Logo />
          <h1 className="mt-8 text-xl font-semibold text-slate-950">
            Sign in to CasaX
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your session is no longer active. Sign in again to access your
            CasaX workspace.
          </p>
          <Button asChild className="mt-7 w-full">
            <Link href="/auth/login">Continue to sign in</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (currentRole === "tenant") {
    return (
      <TenantLayout
        initials={initials}
        onLogout={handleLogout}
        pathname={pathname}
      >
        {children}
      </TenantLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Logo />
        <Badge className="mt-7 w-fit">{roleLabel}</Badge>
        <nav className="mt-7 space-y-1 overflow-y-auto pb-8">
          {visibleNavigation.map(({ label, href, icon: Icon }) => (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "bg-slate-950 font-medium text-white"
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

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <p className="hidden text-sm text-slate-500 lg:block">{dateLabel}</p>

          <div className="flex items-center gap-4">
            <Link
              aria-label="Notifications"
              className="relative text-slate-600"
              href="/notifications"
            >
              <Bell className="size-5" />
            </Link>
            <ProfileMenu initials={initials} onLogout={handleLogout} />
          </div>
        </header>

        <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <nav className="flex gap-2 overflow-x-auto">
            {visibleNavigation.slice(0, 7).map(({ label, href }) => (
              <Link
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${
                  pathname === href || pathname.startsWith(`${href}/`)
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}

function TenantLayout({
  children,
  initials,
  pathname,
  onLogout,
}: {
  children: ReactNode;
  initials: string;
  pathname: string;
  onLogout: () => Promise<void>;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ecfdf5,transparent_34%),#f8fafc] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/50 lg:flex lg:flex-col">
        <Logo />
        <Badge className="mt-7 w-fit">Resident workspace</Badge>
        <nav className="mt-7 space-y-1 overflow-y-auto pb-8">
          {tenantNavigation.map(({ label, href, icon: Icon }) => (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "bg-slate-950 font-medium text-white"
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

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <p className="hidden text-sm text-slate-500 lg:block">
            Resident portal
          </p>
          <div className="flex items-center gap-3">
            <Link
              aria-label="Notifications"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600"
              href="/notifications"
            >
              <Bell className="size-5" />
            </Link>
            <ProfileMenu initials={initials} onLogout={onLogout} dark />
          </div>
        </header>

        <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <nav className="flex gap-2 overflow-x-auto">
            {tenantNavigation.map(({ label, href }) => (
              <Link
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium ${
                  pathname === href || pathname.startsWith(`${href}/`)
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {children}

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-slate-950/10 backdrop-blur lg:hidden">
          {tenantNavigation.slice(0, 5).map(({ label, href, icon: Icon }) => (
            <Link
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium ${
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "bg-slate-950 text-white"
                  : "text-slate-500"
              }`}
              href={href}
              key={href}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function ProfileMenu({
  initials,
  onLogout,
  dark = false,
}: {
  initials: string;
  onLogout: () => Promise<void>;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold ${
          dark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
        }`}
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10">
          <Link
            href="/settings"
            className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Profile settings
          </Link>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
