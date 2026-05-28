import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { Badge, Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import type { VerifiedRental } from "@/lib/rentals";

export function RentalCard({
  rental,
  showActions = false,
}: {
  rental: VerifiedRental;
  showActions?: boolean;
}) {
  return (
    <Card className="group overflow-hidden border-slate-200/80 p-0 shadow-[0_10px_35px_-26px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-28px_rgba(15,23,42,0.32)]">
      <div
        className={`relative h-44 bg-gradient-to-br ${rental.accent} p-5 text-white`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(16,185,129,0.3),transparent_32%)]" />
        <div className="relative flex justify-between gap-3">
          <Badge className="bg-white/10 text-white ring-1 ring-white/20">
            <BadgeCheck className="mr-1.5 size-3.5 text-emerald-300" />
            Verified
          </Badge>
          <p className="text-xs text-slate-300">{rental.availability}</p>
        </div>
        <div className="absolute bottom-5 left-5">
          <p className="text-xs text-slate-300">{rental.propertyName}</p>
          <p className="mt-1 font-medium">{rental.unitName}</p>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold leading-6 text-slate-950">
          {rental.title}
        </h3>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="size-4" />
          {rental.city}, {rental.state}
        </p>
        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-5">
          <div>
            <p className="text-lg font-semibold text-slate-950">
              {formatCurrency(rental.annualRent)}
            </p>
            <p className="text-xs text-slate-500">per year</p>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <BedDouble className="size-4" /> {rental.bedrooms} beds
          </p>
        </div>
        {showActions ? (
          <div className="mt-5 space-y-2">
            <Button
              className="w-full justify-between rounded-xl"
              variant="outline"
              asChild
            >
              <Link href={`/rentals/${rental.slug}`}>
                View details
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="rounded-xl px-2.5 text-xs"
                variant="secondary"
                asChild
              >
                <Link href={`/auth?intent=inspection&rental=${rental.slug}`}>
                  <CalendarDays className="mr-1.5 size-3.5" />
                  Book inspection
                </Link>
              </Button>
              <Button className="rounded-xl px-2.5 text-xs" asChild>
                <Link href={`/auth?intent=apply&rental=${rental.slug}`}>
                  Apply now
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <Link
            className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition group-hover:bg-slate-950 group-hover:text-white"
            href={`/rentals/${rental.slug}`}
          >
            View rental
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </Card>
  );
}
