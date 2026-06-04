"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Search } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { StatusBadge } from "@/components/operations/status-badge";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  getAdminApplications,
  updateAdminApplication,
  type AdminApplicationRecord,
  type AdminUpdateApplicationInput,
} from "@/services/operations";

export default function AdminApplicationsPage() {
  const [search, setSearch] = useState("");
  const applications = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: getAdminApplications,
  });
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (applications.data ?? []).filter((application) => {
      if (!term) return true;
      const profile = application.applicant.user.profile;
      return [
        application.property.name,
        application.unit.name,
        application.property.city,
        application.applicant.user.email,
        profile ? `${profile.firstName} ${profile.lastName}` : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [applications.data, search]);

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX operations"
        title="Application queue"
        description="Review renter applications, coordinate inspection next steps, and prepare approved applicants for resident onboarding."
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
        {applications.isLoading ? <LoadingCards /> : null}
        {applications.isError ? (
          <ErrorState
            title="Unable to load application queue"
            onRetry={() => void applications.refetch()}
          />
        ) : null}
        {applications.isSuccess && rows.length === 0 ? (
          <Card className="py-14 text-center">
            <ClipboardCheck className="mx-auto size-8 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">
              No applications in review
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              CasaX application review records will appear here.
            </p>
          </Card>
        ) : null}
        {rows.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {rows.map((application) => (
              <ApplicationCard application={application} key={application.id} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ApplicationCard({
  application,
}: {
  application: AdminApplicationRecord;
}) {
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      return updateAdminApplication(application.id, {
        status: String(form.get("status")) as AdminUpdateApplicationInput["status"],
        note: String(form.get("note") || ""),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "inspections"] });
    },
  });
  const applicantName = profileName(application.applicant.user.profile);
  const latestInspection = application.inspectionBookings[0];

  return (
    <Card className="border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Application review
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {application.property.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {application.unit.name} / {application.property.city},{" "}
            {application.property.state}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SmallStat label="Applicant" value={applicantName} />
        <SmallStat
          label="Annual rent"
          value={formatCurrency(application.unit.rentAmount)}
        />
        <SmallStat
          label="Inspection"
          value={latestInspection ? latestInspection.status : "Not scheduled"}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
          Onboarding next step
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {nextStep(application.status)}
        </p>
      </div>

      <form className="mt-5 space-y-3" onSubmit={(event) => update.mutate(event)}>
        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          defaultValue={safeEditableStatus(application.status)}
          disabled={application.status === "converted_to_resident"}
          name="status"
        >
          <option value="under_review">Under review</option>
          <option value="inspection_required">Inspection required</option>
          <option value="inspection_scheduled">Inspection scheduled</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <textarea
          className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          name="note"
          placeholder="Optional CasaX review note"
        />
        <Button
          disabled={update.isPending || application.status === "converted_to_resident"}
          type="submit"
        >
          Update application
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
      <p className="mt-1 text-sm font-semibold text-slate-800 capitalize">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}

function profileName(profile?: { firstName: string; lastName: string } | null) {
  return profile ? `${profile.firstName} ${profile.lastName}` : "Applicant";
}

function safeEditableStatus(status: AdminApplicationRecord["status"]) {
  return status === "submitted" || status === "converted_to_resident"
    ? "under_review"
    : status;
}

function nextStep(status: AdminApplicationRecord["status"]) {
  const labels: Record<AdminApplicationRecord["status"], string> = {
    submitted: "Move this application into review or request inspection.",
    under_review: "Continue CasaX application review.",
    inspection_required: "Coordinate inspection booking with the applicant.",
    inspection_scheduled: "Complete inspection coordination before decision.",
    approved: "Resident conversion is pending lease setup.",
    rejected: "Application remains in history for audit visibility.",
    converted_to_resident: "Resident conversion has been completed.",
  };
  return labels[status];
}
