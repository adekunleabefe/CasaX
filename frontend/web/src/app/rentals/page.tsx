import type { Metadata } from "next";
import { BadgeCheck, CalendarDays, Home, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@casax/ui";
import { RentalsExplorer } from "@/components/rentals-explorer";
import { getRentals, previewRentals } from "@/lib/rentals";

export const metadata: Metadata = {
  title: "Verified Rentals | CasaX",
  description:
    "Browse verified apartments with clear rent details, inspection options, and CasaX support.",
};

interface RentalsPageProps {
  searchParams?: Promise<{
    location?: string;
    unitType?: string;
    minRent?: string;
    maxRent?: string;
    bedrooms?: string;
  }>;
}

export default async function RentalsPage({ searchParams }: RentalsPageProps) {
  const filters = (await searchParams) ?? {};
  const rentals = await getRentals(filters);
  const hasLiveRentals = rentals.items.length > 0;

  return (
    <main>
      <section className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_80%_15%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(to_bottom,#f8fafc,white)]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <Badge className="border border-emerald-100 bg-white px-4 py-2 shadow-sm">
            <BadgeCheck className="mr-2 size-4" />
            Verified availability
          </Badge>
          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Verified rentals
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Browse verified apartments with clear rent details, inspection
              booking, and secure application flows.
            </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: "CasaX-reviewed rentals", icon: ShieldCheck },
                { label: "Inspection booking", icon: CalendarDays },
                { label: "Resident support after move-in", icon: Home },
              ].map(({ label, icon: Icon }) => (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
                  key={label}
                >
                  <Icon className="size-4 text-emerald-700" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10 lg:px-8 lg:py-12">
        {hasLiveRentals ? (
          <RentalsExplorer initialFilters={filters} rentals={rentals.items} />
        ) : (
          <>
            <Card className="mb-8 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center shadow-none">
              <h2 className="text-lg font-semibold text-slate-950">
                Explore sample apartments while CasaX expands verified rental
                coverage.
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                These preview apartments show property marketing information
                only. Live rentals will replace them automatically once
                CasaX-approved rentals are published.
              </p>
            </Card>
            <RentalsExplorer
              initialFilters={filters}
              rentals={previewRentals}
              isPreviewMode
            />
          </>
        )}
      </section>
    </main>
  );
}
