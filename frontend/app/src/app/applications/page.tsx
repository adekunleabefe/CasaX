"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarClock, ClipboardCheck, DoorOpen, Users } from "lucide-react";
import type { ApplicationStatus } from "@casax/types";
import { Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useApplications } from "@/features/operations/queries";

const statuses: { label: string; value: ApplicationStatus | "" }[] = [
  { label: "Active vacancies", value: "" },
  { label: "Inspection scheduled", value: "inspection_booked" },
  { label: "Applications received", value: "pending" },
  { label: "Onboarding in progress", value: "under_review" },
  { label: "Filled", value: "converted_to_tenant" },
];

export default function ApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const applications = useApplications(status);
  const items = applications.data?.items ?? [];
  const inspectionScheduled = items.filter(
    (item) => item.status === "inspection_booked",
  ).length;
  const applicationsReceived = items.filter(
    (item) => item.status === "pending",
  ).length;
  const onboarding = items.filter((item) =>
    ["under_review", "approved"].includes(item.status),
  ).length;
  const filled = items.filter(
    (item) => item.status === "converted_to_tenant",
  ).length;

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Vacancies"
        title="Vacancies"
        description="Track available units, applicant interest, inspection status, and CasaX-managed onboarding progress."
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <VacancyMetric icon={DoorOpen} label="Tracked vacancies" value={items.length} />
        <VacancyMetric
          icon={CalendarClock}
          label="Inspections scheduled"
          value={inspectionScheduled}
        />
        <VacancyMetric
          icon={Users}
          label="Applications received"
          value={applicationsReceived}
        />
        <VacancyMetric
          icon={ClipboardCheck}
          label="Onboarding in progress"
          value={onboarding}
        />
        <VacancyMetric icon={ClipboardCheck} label="Filled" value={filled} />
      </section>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {statuses.map((item) => (
          <button
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              status === item.value
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
            key={item.label}
            onClick={() => setStatus(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="mt-5">
        {applications.isLoading ? <LoadingCards /> : null}
        {applications.isError ? (
          <ErrorState
            title="Unable to load applications"
            onRetry={() => void applications.refetch()}
          />
        ) : null}
        {applications.data?.items.length === 0 ? (
          <Card className="py-14 text-center">
            <ClipboardCheck className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No applications in this view</h2>
            <p className="mt-2 text-sm text-slate-500">
              Vacancy interest, inspection activity, and CasaX onboarding
              progress will appear here.
            </p>
          </Card>
        ) : null}
        {applications.data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {applications.data.items.map((application) => {
              const profile = application.applicant.user.profile;
              return (
                <Link
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:border-emerald-200 hover:bg-emerald-50/30"
                  href={`/applications/${application.id}`}
                  key={application.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">
                        {application.property.name}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-slate-950">
                        {application.unit.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {application.unit.unitType} /{" "}
                        {formatCurrency(application.unit.rentAmount)}
                      </p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>

                  <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
                    <VacancyDetail
                      label="Days vacant"
                      value={daysSince(application.createdAt)}
                    />
                    <VacancyDetail
                      label="Inspection status"
                      value={
                        application.status === "inspection_booked"
                          ? "Scheduled"
                          : "Monitoring"
                      }
                    />
                    <VacancyDetail
                      label="Applicant count"
                      value="1"
                    />
                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    Applicant interest from{" "}
                    {profile
                      ? `${profile.firstName} ${profile.lastName}`
                      : application.applicant.user.email}
                    . CasaX coordinates review and onboarding progress.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                    Review visibility <ArrowRight className="size-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function VacancyMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DoorOpen;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <Icon className="size-4 text-emerald-700" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </Card>
  );
}

function VacancyDetail({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="block text-xs text-slate-500">{label}</span>
      <span className="mt-1 block font-semibold text-slate-950">{value}</span>
    </span>
  );
}

function daysSince(value: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
  return `${days} day${days === 1 ? "" : "s"}`;
}
