"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarRange,
  FileText,
  Home,
  KeyRound,
  UserRound,
} from "lucide-react";
import type { TenancyStatus } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import {
  useTenancies,
  useTenancyAgreement,
} from "@/features/tenancies/queries";
import { useCurrentUser } from "@/features/auth/queries";

const statuses: { label: string; value: TenancyStatus | "" }[] = [
  { label: "All tenancies", value: "" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Expired", value: "expired" },
  { label: "Terminated", value: "terminated" },
];

export default function TenanciesPage() {
  const currentUser = useCurrentUser();

  if (currentUser.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }

  if (currentUser.data?.role === "tenant") {
    return <TenantHomePage />;
  }

  return <OperationalTenanciesPage />;
}

function OperationalTenanciesPage() {
  const [status, setStatus] = useState<TenancyStatus | "">("");
  const tenancies = useTenancies(status);
  const records = tenancies.data?.items ?? [];
  const activeResidents = records.filter((item) => item.status === "active").length;
  const expiringSoon = records.filter((item) => daysUntil(item.endDate) <= 60 && daysUntil(item.endDate) >= 0).length;
  const renewalsDue = records.filter((item) => daysUntil(item.endDate) <= 30 && item.status === "active").length;
  const terminated = records.filter((item) => item.status === "terminated").length;

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Residents"
        title="Residents"
        description="Monitor approved residents, active tenancies, lease periods, and occupancy status across your portfolio."
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResidentMetric label="Active Residents" value={activeResidents} />
        <ResidentMetric label="Renewals Due" value={renewalsDue} />
        <ResidentMetric label="Expiring Soon" value={expiringSoon} />
        <ResidentMetric label="Terminated" value={terminated} />
      </section>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {statuses.map((item) => (
          <button
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
              item.value === status
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
        {tenancies.isLoading ? <LoadingCards /> : null}

        {tenancies.isError ? (
          <ErrorState
            title="Unable to load tenancies"
            onRetry={() => void tenancies.refetch()}
          />
        ) : null}

        {tenancies.data?.items.length === 0 ? (
          <Card className="py-14 text-center">
            <KeyRound className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No tenancies in this view</h2>
            <p className="mt-2 text-sm text-slate-500">
              Approved applications become tenancy records after CasaX review.
            </p>
          </Card>
        ) : null}

        {tenancies.data?.items.length ? (
          <Card className="overflow-hidden p-0">
            <div className="hidden grid-cols-[1.25fr_1fr_0.9fr_1fr_0.9fr_0.9fr_0.9fr_110px_90px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 xl:grid">
              <span>Resident</span>
              <span>Property</span>
              <span>Unit</span>
              <span>Annual rent</span>
              <span>Move-in date</span>
              <span>Lease end date</span>
              <span>Renewal due</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {tenancies.data.items.map((tenancy) => {
                const profile = tenancy.user.profile;
                const residentName = profile
                  ? `${profile.firstName} ${profile.lastName}`
                  : tenancy.user.email;

                return (
                  <Link
                    className="block px-5 py-5 transition hover:bg-emerald-50/30 xl:grid xl:grid-cols-[1.25fr_1fr_0.9fr_1fr_0.9fr_0.9fr_0.9fr_110px_90px] xl:items-center xl:gap-4"
                    href={`/tenancies/${tenancy.id}`}
                    key={tenancy.id}
                  >
                    <div className="flex items-start justify-between gap-4 xl:block">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {residentName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {tenancy.user.email}
                        </p>
                      </div>
                      <div className="xl:hidden">
                        <StatusBadge status={tenancy.status} />
                      </div>
                    </div>
                    <ResidentCell label="Property" value={tenancy.property.name} />
                    <ResidentCell label="Unit" value={tenancy.unit.name} />
                    <ResidentCell
                      label="Annual rent"
                      value={formatCurrency(tenancy.rentAmount)}
                    />
                    <ResidentCell
                      label="Move-in date"
                      value={formatDate(tenancy.startDate)}
                    />
                    <ResidentCell
                      label="Lease end date"
                      value={formatDate(tenancy.endDate)}
                    />
                    <ResidentCell
                      label="Renewal due"
                      value={formatDate(renewalDueDate(tenancy.endDate))}
                    />
                    <div className="mt-4 hidden xl:mt-0 xl:block">
                      <StatusBadge status={tenancy.status} />
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 xl:mt-0">
                      Open <ArrowRight className="size-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>
        ) : null}
      </section>
    </main>
  );
}

function ResidentCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm xl:mt-0 xl:block">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 xl:hidden">
        {label}
      </span>
      <span className="font-medium text-slate-700 xl:text-slate-600">{value}</span>
    </div>
  );
}

function ResidentMetric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </Card>
  );
}

function daysUntil(value: string) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

function renewalDueDate(value: string) {
  const date = new Date(value);
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

function TenantHomePage() {
  const tenancies = useTenancies("");
  const activeTenancy = tenancies.data?.items.find(
    (tenancy) => tenancy.status === "active" || tenancy.status === "pending",
  );
  const agreement = useTenancyAgreement(activeTenancy?.id ?? "");
  const tenantAgreementStatus = getTenantAgreementStatus(agreement.data?.status);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Your home</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Current tenancy
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Residence details, lease information and home support in one calm
          place.
        </p>
      </header>

      {tenancies.isLoading ? <LoadingCards /> : null}

      {tenancies.isError ? (
        <ErrorState
          title="Unable to load your home"
          onRetry={() => void tenancies.refetch()}
        />
      ) : null}

      {!tenancies.isLoading && !tenancies.isError && !activeTenancy ? (
        <Card className="mt-6 py-14 text-center">
          <Home className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-4 font-semibold">No residence record yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your home details will appear here once your tenancy is active.
          </p>
        </Card>
      ) : null}

      {activeTenancy ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  Residence details
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {activeTenancy.property.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {activeTenancy.property.address}, {activeTenancy.property.city}
                  , {activeTenancy.property.state}
                </p>
              </div>
              <StatusBadge status={activeTenancy.status} />
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <ResidentInfo
                icon={Home}
                label="Unit"
                value={`${activeTenancy.unit.name} / ${activeTenancy.unit.unitType}`}
              />
              <ResidentInfo
                icon={CalendarRange}
                label="Lease period"
                value={`${formatDate(activeTenancy.startDate)} - ${formatDate(
                  activeTenancy.endDate,
                )}`}
              />
              <ResidentInfo
                icon={KeyRound}
                label="Rent"
                value={`${formatCurrency(activeTenancy.rentAmount)} / ${
                  activeTenancy.paymentFrequency
                }`}
              />
              <ResidentInfo
                icon={UserRound}
                label="Manager contact"
                value="Available from your landlord"
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <FileText className="size-5 text-emerald-700" />
              <h2 className="mt-4 font-semibold text-slate-950">
                Agreement status
              </h2>

              {agreement.data ? (
                <>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">
                      {agreement.data.agreementNumber}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {tenantAgreementStatus}
                    </span>
                  </div>

                  <Button asChild className="mt-5 w-full" variant="ghost">
                    <Link href={`/tenancies/${activeTenancy.id}#agreement`}>
                      View agreement
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Your tenancy agreement will appear here once issued.
                </p>
              )}
            </Card>

            <Card className="bg-emerald-50/60">
              <h2 className="font-semibold text-slate-950">Renewal</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Renewal and move-out requests will be available here when your
                manager enables them.
              </p>
              <Button className="mt-5 w-full" variant="ghost">
                Request move-out
              </Button>
            </Card>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ResidentInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="size-4 text-emerald-700" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-slate-950">
        {value}
      </p>
    </div>
  );
}

function getTenantAgreementStatus(status?: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "generated":
      return "Ready soon";
    case "sent":
      return "Ready to review";
    case "signed":
      return "Signed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Agreement ready";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
