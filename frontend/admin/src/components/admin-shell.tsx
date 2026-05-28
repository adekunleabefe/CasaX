import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge, Logo } from "@casax/ui";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Landlords", href: "/landlords", icon: Users },
  { label: "Applications", href: "/applications", icon: ListChecks },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Activity logs", href: "/activity", icon: Activity },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Logo />
        <Badge className="mt-7 w-fit bg-orange-50 text-orange-700">
          Internal admin
        </Badge>
        <nav className="mt-7 space-y-1">
          {navigation.map(({ label, href, icon: Icon }, index) => (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                index === 0
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
      <div>
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden items-center gap-2 text-sm font-medium lg:flex">
            <ShieldCheck className="size-4 text-emerald-600" />
            Platform operations
          </div>
          <button
            className="relative text-slate-600"
            aria-label="Admin notifications"
          >
            <Bell className="size-5" />
            <span className="absolute -right-1 -top-1 size-2 rounded-full bg-orange-500" />
          </button>
        </header>
        <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
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
        {children}
      </div>
    </div>
  );
}
