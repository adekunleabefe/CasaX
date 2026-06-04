"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, CalendarDays, MapPin, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import {
  useCreateApplication,
  useCreateInspectionBooking,
  useRemoveSavedRental,
  useSavedRentals,
} from "@/lib/applicant-queries";

export default function SavedRentalsPage() {
  const saved = useSavedRentals();
  const remove = useRemoveSavedRental();
  const inspection = useCreateInspectionBooking();
  const application = useCreateApplication();
  const rows = saved.data ?? [];

  return (
    <>
      {saved.isLoading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              className="h-72 animate-pulse rounded-[1.75rem] bg-slate-100"
              key={item}
            />
          ))}
        </div>
      ) : null}
      {rows.length === 0 && !saved.isLoading ? (
        <EmptyState />
      ) : null}
      {rows.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((record) => {
            const rental = record.rental;
            return (
              <Card
                className="group overflow-hidden border-slate-200 bg-white p-0 shadow-sm shadow-slate-200/50"
                key={record.id}
              >
                <div className="h-36 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.26),transparent_32%),linear-gradient(135deg,#0f172a,#334155)] p-4 text-white">
                  <div className="flex justify-between gap-3">
                    <Badge className="bg-white/15 text-white backdrop-blur">
                      Saved rental
                    </Badge>
                    <button
                      aria-label="Remove saved rental"
                      className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(record.id)}
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    {rental.unitType}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-slate-950">
                    {rental.title || `${rental.propertyName} / ${rental.unitName}`}
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="size-4 text-slate-400" />
                    {rental.city}, {rental.state}
                  </p>
                  <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                    {formatCurrency(rental.annualRent)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Annual rent</p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button
                      className="rounded-xl"
                      disabled={inspection.isPending}
                      onClick={() =>
                        inspection.mutate({
                          vacancyListingId: rental.vacancyListingId,
                        })
                      }
                      type="button"
                      variant="secondary"
                    >
                      <CalendarDays className="mr-1.5 size-4" />
                      Book
                    </Button>
                    <Button
                      className="rounded-xl"
                      disabled={application.isPending}
                      onClick={() =>
                        application.mutate({
                          propertyId: rental.propertyId,
                          unitId: rental.unitId,
                          vacancyListingId: rental.vacancyListingId,
                          notes:
                            "Application started from saved rentals in the CasaX account.",
                        })
                      }
                      type="button"
                    >
                      Apply
                    </Button>
                  </div>
                  <Button
                    className="mt-3 w-full justify-between rounded-xl"
                    variant="outline"
                    asChild
                  >
                    <Link href="/rentals">
                      View rentals
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

function EmptyState() {
  return (
    <Card className="mt-8 overflow-hidden border-slate-200 bg-white p-0 text-center shadow-sm shadow-slate-200/50">
      <div className="bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)] px-6 py-14">
        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-white text-emerald-700 shadow-sm">
          <Bookmark className="size-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-slate-950">
          Found something interesting? Save it for later.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Keep verified apartments close while you compare rent, location, and
          inspection availability.
        </p>
        <Button asChild className="mt-7 rounded-2xl">
          <Link href="/rentals">Browse rentals</Link>
        </Button>
      </div>
    </Card>
  );
}
