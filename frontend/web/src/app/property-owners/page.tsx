import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ReceiptText,
  Send,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Badge, Button, Card } from "@casax/ui";

export const metadata: Metadata = {
  title: "Property Owners | CasaX Rental Operations",
  description:
    "CasaX coordinates verified rental publishing, resident onboarding, rent collection visibility, maintenance requests, reporting, and remittance tracking for rental property owners.",
};

const services = [
  {
    title: "Property Review",
    detail: "CasaX reviews submitted property records before rentals go live.",
    icon: ShieldCheck,
  },
  {
    title: "Verified Rental Publishing",
    detail: "Approved apartments can be published as CasaX-reviewed rentals.",
    icon: BadgeCheck,
  },
  {
    title: "Inspection Coordination",
    detail: "Inspection requests move through a structured CasaX workflow.",
    icon: CalendarDays,
  },
  {
    title: "Resident Onboarding",
    detail: "CasaX helps coordinate application review, tenancy setup, and move-in.",
    icon: ClipboardCheck,
  },
  {
    title: "Rent Collection Visibility",
    detail: "Track rent collection records and status from the operations portal.",
    icon: ReceiptText,
  },
  {
    title: "Maintenance Coordination",
    detail: "Monitor tenant issues and CasaX coordination status across units.",
    icon: Wrench,
  },
  {
    title: "Reporting",
    detail: "Review portfolio updates, occupancy changes, and operating summaries.",
    icon: BarChart3,
  },
  {
    title: "Remittance Tracking",
    detail: "See collected funds, pending remittance, and payout visibility.",
    icon: Send,
  },
];

export default function PropertyOwnersPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_74%_18%,rgba(16,185,129,0.13),transparent_32%),linear-gradient(to_bottom,#f8fafc,white)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <Badge className="mb-7 border border-emerald-100 bg-white px-4 py-2 shadow-sm">
              <Building2 className="mr-2 size-4 text-emerald-700" />
              For Property Owners
            </Badge>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl">
              Rental operations without daily management stress
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              CasaX coordinates verified rentals, resident onboarding, rent collection
              visibility, maintenance requests, and reporting.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="rounded-full bg-slate-950 px-7 py-3.5 text-white hover:bg-slate-800"
                asChild
              >
                <Link href="#assessment">
                  Request Property Assessment{" "}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button className="rounded-full px-7 py-3.5" variant="outline" asChild>
                <Link href="mailto:hello@casax.ng?subject=Talk%20to%20CasaX">
                  Talk to CasaX
                </Link>
              </Button>
            </div>
          </div>
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-medium text-slate-300">
                CasaX operations
              </p>
              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.04em]">
                Submit property. CasaX coordinates the rental lifecycle.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Property owners get visibility into occupancy, rentals, rent
                collection, maintenance, reporting, and remittance status.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Verified rentals",
                "Inspection workflow",
                "Resident onboarding",
                "Remittance visibility",
              ].map((item) => (
                <div
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  key={item}
                >
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
            Service coverage
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Operational support from rental readiness to resident lifecycle.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            CasaX works directly with qualified property owners to define the
            right service coverage for their portfolio.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {services.map(({ title, detail, icon: Icon }) => (
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

      <section
        className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-16 sm:pb-20 lg:px-8 lg:pb-28"
        id="assessment"
      >
        <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Request assessment
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Let CasaX review your rental property.
            </h2>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Share basic property details and CasaX will follow up on review,
              rental readiness, onboarding scope, and operations coverage.
            </p>
          </div>
          <form
            action="mailto:hello@casax.ng"
            className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.22)] sm:grid-cols-2"
            method="post"
          >
            <label className="text-sm font-medium text-slate-700">
              Full name
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                name="name"
                placeholder="Your name"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Property location
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                name="location"
                placeholder="Lagos, Abuja, Port Harcourt..."
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Number of units
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                min={1}
                name="units"
                placeholder="12"
                type="number"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              What should CasaX know?
              <textarea
                className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                name="message"
                placeholder="Tell us about rental status, rent collection needs, maintenance concerns, or onboarding support."
              />
            </label>
            <div className="sm:col-span-2">
              <Button
                className="w-full rounded-2xl bg-slate-950 py-3 text-white hover:bg-slate-800 sm:w-auto"
                type="submit"
              >
                Request Property Assessment
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
