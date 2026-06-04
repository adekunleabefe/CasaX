"use client";

import Link from "next/link";
import { CalendarDays, Clock, Home, MapPin } from "lucide-react";
import { Button, Card } from "@casax/ui";
import {
  useCancelInspectionBooking,
  useInspectionBookings,
} from "@/lib/applicant-queries";
import { InspectionStatusChip } from "@/components/applicant/status-chip";

export default function InspectionsPage() {
  const inspections = useInspectionBookings();
  const cancel = useCancelInspectionBooking();
  const rows = inspections.data ?? [];

  return (
    <>
      {inspections.isLoading ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              className="h-56 animate-pulse rounded-[1.75rem] bg-slate-100"
              key={item}
            />
          ))}
        </div>
      ) : null}
      {rows.length === 0 && !inspections.isLoading ? (
        <EmptyState />
      ) : null}
      {rows.length > 0 ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {rows.map((inspection) => (
            <Card
              className="border-slate-200 bg-white shadow-sm shadow-slate-200/50"
              key={inspection.id}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <CalendarDays className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                      {inspection.rental.propertyName}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Home className="size-4 text-slate-400" />
                      {inspection.rental.unitName}
                    </p>
                  </div>
                </div>
                <InspectionStatusChip status={inspection.status} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Fact
                  icon={CalendarDays}
                  label="Date"
                  value={formatDate(inspection.scheduledAt)}
                />
                <Fact
                  icon={Clock}
                  label="Time"
                  value={formatTime(inspection.scheduledAt)}
                />
                <Fact
                  icon={MapPin}
                  label="Location"
                  value={`${inspection.rental.city}, ${inspection.rental.state}`}
                />
              </div>

              {["pending", "confirmed"].includes(inspection.status) ? (
                <Button
                  className="mt-6 rounded-2xl"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate(inspection.id)}
                  type="button"
                  variant="outline"
                >
                  Cancel request
                </Button>
              ) : null}
            </Card>
          ))}
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
          <CalendarDays className="size-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-slate-950">
          Ready to see a place in person?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Book an inspection on any verified rental and track the status here.
        </p>
        <Button asChild className="mt-7 rounded-2xl">
          <Link href="/rentals">Browse rentals</Link>
        </Button>
      </div>
    </Card>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <Icon className="size-4 text-emerald-700" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
