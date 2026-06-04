"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, Search, UserRound } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  getAdminApplications,
  getAdminResidentOnboardingSummary,
  getAdminResidents,
  type AdminApplicationRecord,
  type AdminResidentRecord,
} from "@/services/operations";

export default function AdminResidentsPage() {
  const [search, setSearch] = useState("");
  const residents = useQuery({
    queryKey: ["admin", "residents"],
    queryFn: getAdminResidents,
  });
  const onboardingSummary = useQuery({
    queryKey: ["admin", "resident-onboarding-summary"],
    queryFn: getAdminResidentOnboardingSummary,
  });
  const applications = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: getAdminApplications,
  });
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (residents.data ?? []).filter((resident) => {
      if (!term) return true;
      return [
        residentName(resident),
        resident.resident.email,
        resident.property.name,
        resident.unit.name,
        resident.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [residents.data, search]);

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX Operations"
        title="Residents"
        description="View active residents, occupied units, tenancy periods, and annual rent inherited from units."
        action={
          <Button asChild>
            <Link href="/residents/onboard">
              <Plus className="mr-2 size-4" />
              Onboard Resident
            </Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          isLoading={onboardingSummary.isLoading}
          label="Active Residents"
          value={onboardingSummary.data?.activeResidents ?? 0}
        />
        <SummaryCard
          isLoading={onboardingSummary.isLoading}
          label="Pending Onboarding"
          value={
            onboardingSummary.data?.approvedApplicantsAwaitingOnboarding ?? 0
          }
        />
        <SummaryCard
          isLoading={onboardingSummary.isLoading}
          label="Available Units"
          value={onboardingSummary.data?.availableUnits ?? 0}
        />
        <SummaryCard
          isLoading={onboardingSummary.isLoading}
          label="Expiring Leases"
          value={onboardingSummary.data?.expiringLeases ?? 0}
        />
      </div>

      <PendingOnboardingSection
        applications={applications.data ?? []}
        isError={applications.isError}
        isLoading={applications.isLoading}
        onRetry={() => void applications.refetch()}
      />

      <Card className="mt-8 border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="size-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resident, property, unit, or status"
            value={search}
          />
        </div>
      </Card>

      <section className="mt-7">
        {residents.isLoading ? <LoadingCards /> : null}
        {residents.isError ? (
          <ErrorState
            title="Unable to load residents"
            onRetry={() => void residents.refetch()}
          />
        ) : null}
        {residents.isSuccess && rows.length === 0 ? (
          <Card className="py-14 text-center">
            <UserRound className="mx-auto size-8 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">
              No active residents yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Converted applicants and existing residents will appear here once
              their unit tenancy is created.
            </p>
          </Card>
        ) : null}
        {rows.length ? <ResidentsTable rows={rows} /> : null}
      </section>
    </main>
  );
}

function PendingOnboardingSection({
  applications,
  isLoading,
  isError,
  onRetry,
}: {
  applications: AdminApplicationRecord[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const approved = applications.filter(
    (application) => application.status === "approved",
  );

  return (
    <section className="mt-8 grid gap-5 xl:grid-cols-2">
      <Card className="border-slate-200 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-950">
              Pending onboarding
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Approved applicants and existing residents should be converted
              through the unit-based onboarding flow.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/residents/onboard">Open onboarding</Link>
          </Button>
        </div>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <h2 className="font-semibold text-slate-950">
          Approved applicants awaiting conversion
        </h2>
        {isLoading ? (
          <div className="mt-5 h-24 animate-pulse rounded-2xl bg-slate-100" />
        ) : null}
        {isError ? (
          <button
            className="mt-5 rounded-xl bg-orange-50 p-4 text-left text-sm text-orange-700"
            onClick={onRetry}
            type="button"
          >
            Unable to load approved applicants. Retry.
          </button>
        ) : null}
        {!isLoading && !isError && approved.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Approved applicants awaiting resident onboarding will appear here.
          </p>
        ) : null}
        {approved.length ? (
          <div className="mt-5 space-y-3">
            {approved.slice(0, 4).map((application) => (
              <div
                className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                key={application.id}
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-950">
                    {application.applicant.user.profile
                      ? `${application.applicant.user.profile.firstName} ${application.applicant.user.profile.lastName}`
                      : application.applicant.user.email}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {application.property.name} / {application.unit.name}
                  </span>
                </span>
                <Button asChild className="px-3 py-2 text-xs" variant="outline">
                  <Link href="/residents/onboard">Convert</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      {isLoading ? (
        <div className="mt-4 h-9 w-20 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
      )}
    </Card>
  );
}

function ResidentsTable({ rows }: { rows: AdminResidentRecord[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden grid-cols-[1fr_1fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr_1.2fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
        <span>Resident</span>
        <span>Property</span>
        <span>Unit</span>
        <span>Annual Rent</span>
        <span>Lease Start</span>
        <span>Lease End</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((resident) => (
          <ResidentRow key={resident.id} resident={resident} />
        ))}
      </div>
    </Card>
  );
}

function ResidentRow({ resident }: { resident: AdminResidentRecord }) {
  return (
    <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr_1.2fr] lg:items-center">
      <Metric label="Resident" value={residentName(resident)} />
      <Metric label="Property" value={resident.property.name} />
      <Metric
        label="Unit"
        value={`${resident.unit.name} / ${resident.unit.unitType}`}
      />
      <Metric label="Annual Rent" value={formatCurrency(resident.annualRent)} />
      <Metric
        label="Lease Start"
        value={new Date(resident.leaseStart).toLocaleDateString()}
      />
      <Metric
        label="Lease End"
        value={new Date(resident.leaseEnd).toLocaleDateString()}
      />
      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {resident.status.toLowerCase()}
      </span>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="px-3 py-2 text-xs" variant="outline">
          <Link href={`/residents/${resident.id}`}>
            View <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
        <Button className="px-3 py-2 text-xs" disabled variant="ghost">
          Renew Lease
        </Button>
        <Button className="px-3 py-2 text-xs" disabled variant="ghost">
          Transfer Unit
        </Button>
        <Button className="px-3 py-2 text-xs" disabled variant="ghost">
          Terminate Tenancy
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400 lg:hidden">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700 lg:mt-0">
        {value}
      </p>
    </div>
  );
}

function residentName(resident: AdminResidentRecord) {
  return resident.resident.profile
    ? `${resident.resident.profile.firstName} ${resident.resident.profile.lastName}`
    : resident.resident.email;
}
