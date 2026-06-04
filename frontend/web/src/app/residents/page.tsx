import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  FileText,
  Headphones,
  Home,
  ReceiptText,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { Badge, Button, Card } from "@casax/ui";

export const metadata: Metadata = {
  title: "Resident Services | CasaX",
  description:
    "Resident services powered by CasaX for rent tracking, maintenance coordination, renewals, tenancy records, and support after move-in.",
};

const features = [
  {
    title: "Rent tracking",
    detail: "Review rent records, upcoming dues, payment history, and receipts.",
    icon: ReceiptText,
  },
  {
    title: "Maintenance requests",
    detail: "Submit home issues and follow coordination updates from CasaX.",
    icon: Wrench,
  },
  {
    title: "Renewal reminders",
    detail: "Stay ahead of tenancy expiry dates and renewal milestones.",
    icon: RefreshCw,
  },
  {
    title: "Resident support",
    detail: "Access support for tenancy-related questions and service requests.",
    icon: Headphones,
  },
  {
    title: "Tenancy records",
    detail: "Keep lease information, agreement status, and home records organized.",
    icon: FileText,
  },
];

const supportItems = [
  "Rent payments and receipts",
  "Maintenance coordination",
  "Agreement and lease records",
  "Renewal reminders",
  "Resident notifications",
];

export default function ResidentsPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(to_bottom,#f8fafc,white)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <Badge className="mb-7 border border-emerald-100 bg-white px-4 py-2 shadow-sm">
              <Home className="mr-2 size-4 text-emerald-700" />
              Resident Portal
            </Badge>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl">
              Resident services powered by CasaX
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Rent payments, maintenance coordination, renewals, and resident
              support from one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="rounded-full bg-slate-950 px-7 py-3.5 text-white hover:bg-slate-800"
                asChild
              >
                <Link href="https://app.casax.ng/login">
                  Access Resident Portal <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button className="rounded-full px-7 py-3.5" variant="outline" asChild>
                <Link href="/rentals">Browse verified rentals</Link>
              </Button>
            </div>
          </div>
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">
                  Resident overview
                </p>
                <BellRing className="size-5 text-emerald-300" />
              </div>
              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.04em]">
                Your home records, kept clear.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                CasaX keeps the resident journey connected after move-in, from
                rent history to maintenance and renewal updates.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {supportItems.map((item) => (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  key={item}
                >
                  <span className="size-2 rounded-full bg-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            After move-in
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            A calmer way to stay connected to your tenancy.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            The resident portal is designed around the things renters actually
            need after moving in: rent clarity, support, records, and timely
            updates.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {features.map(({ title, detail, icon: Icon }) => (
            <Card
              className="border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              key={title}
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
