import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@casax/ui";
import { RentalsExplorer } from "@/components/rentals-explorer";
import { verifiedRentals } from "@/lib/rentals";

export const metadata: Metadata = {
  title: "Verified Rentals | CasaX",
  description:
    "Browse verified vacant units published directly from CasaX property records.",
};

export default function RentalsPage() {
  return (
    <main>
      <section className="border-b border-slate-200/70 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <Badge className="border border-emerald-100 bg-white px-4 py-2 shadow-sm">
            <BadgeCheck className="mr-2 size-4" />
            Verified availability
          </Badge>
          <div className="mt-7 max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Rentals published from real vacancy records.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Browse homes listed by active landlords and verified through CasaX
              property operations.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14 lg:px-8 lg:py-16">
        <RentalsExplorer rentals={verifiedRentals} />
      </section>
    </main>
  );
}
