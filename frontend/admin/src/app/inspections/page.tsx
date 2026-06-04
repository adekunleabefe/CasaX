"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  getAdminInspections,
  updateAdminInspection,
  type AdminInspectionRecord,
  type AdminInspectionStatus,
} from "@/services/operations";

const statusLabels: Record<AdminInspectionStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminInspectionsPage() {
  const [search, setSearch] = useState("");
  const inspections = useQuery({
    queryKey: ["admin", "inspections"],
    queryFn: getAdminInspections,
  });
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (inspections.data ?? []).filter((inspection) => {
      if (!term) return true;
      const profile = inspection.applicant.user.profile;
      return [
        inspection.rental.propertyName,
        inspection.rental.unitName,
        inspection.rental.location,
        inspection.applicant.user.email,
        profile ? `${profile.firstName} ${profile.lastName}` : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [inspections.data, search]);

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX operations"
        title="Inspection queue"
        description="Coordinate inspection requests from applicants and residents for verified CasaX rentals."
      />

      <Card className="mt-8 border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="size-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applicant, property, unit, or location"
            value={search}
          />
        </div>
      </Card>

      <section className="mt-7">
        {inspections.isLoading ? <LoadingCards /> : null}
        {inspections.isError ? (
          <ErrorState
            title="Unable to load inspection queue"
            onRetry={() => void inspections.refetch()}
          />
        ) : null}
        {inspections.isSuccess && rows.length === 0 ? (
          <Card className="py-14 text-center">
            <CalendarDays className="mx-auto size-8 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">
              No inspection requests yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              CasaX inspection coordination requests will appear here.
            </p>
          </Card>
        ) : null}
        {rows.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {rows.map((inspection) => (
              <InspectionCard inspection={inspection} key={inspection.id} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function InspectionCard({
  inspection,
}: {
  inspection: AdminInspectionRecord;
}) {
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      return updateAdminInspection(inspection.id, {
        status: String(form.get("status")) as AdminInspectionStatus,
        scheduledAt: String(form.get("scheduledAt") || inspection.scheduledAt),
        note: String(form.get("note") || ""),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "inspections"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
    },
  });
  const applicantName = profileName(inspection.applicant.user.profile);

  return (
    <Card className="border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {statusLabels[inspection.status]}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {inspection.rental.propertyName}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {inspection.rental.unitName} / {inspection.rental.location}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {formatCurrency(inspection.rental.annualRent)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SmallStat label="Applicant" value={applicantName} />
        <SmallStat label="Date" value={formatDate(inspection.scheduledAt)} />
        <SmallStat label="Time" value={formatTime(inspection.scheduledAt)} />
      </div>

      <form className="mt-5 space-y-3" onSubmit={(event) => update.mutate(event)}>
        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          defaultValue={inspection.status}
          name="status"
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          defaultValue={toDatetimeLocal(inspection.scheduledAt)}
          name="scheduledAt"
          type="datetime-local"
        />
        <textarea
          className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          name="note"
          placeholder="Optional operations note"
        />
        <Button disabled={update.isPending} type="submit">
          Update inspection
        </Button>
      </form>
    </Card>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function profileName(profile?: { firstName: string; lastName: string } | null) {
  return profile ? `${profile.firstName} ${profile.lastName}` : "Applicant";
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

function toDatetimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}
