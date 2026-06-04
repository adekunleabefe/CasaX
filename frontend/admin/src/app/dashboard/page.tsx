"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Landmark,
  ListChecks,
  Users,
} from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { getAdminDashboardSummary } from "@/services/operations";

const emptySummary = {
  totalProperties: 0,
  totalUnits: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  occupancyRate: 0,
  activeResidents: 0,
  pendingRemittancesAmount: 0,
  rentCollected: 0,
  leaseRenewalsDue: 0,
  liveRentalListings: 0,
  pendingInspections: 0,
  applicationsInReview: 0,
  pendingResidentOnboarding: 0,
  completedRemittancesAmount: 0,
  failedRemittancesCount: 0,
};

const pipelineItems = [
  {
    label: "Property setup",
    href: "/property-setup",
    description: "Create records, generate units, and complete setup.",
    icon: Building2,
  },
  {
    label: "Vacancy publishing",
    href: "/vacancy-publishing",
    description: "Prepare verified vacant units for public rental listings.",
    icon: ClipboardCheck,
  },
  {
    label: "Inspection queue",
    href: "/inspections",
    description: "Coordinate renter visits and status updates.",
    icon: CalendarDays,
  },
  {
    label: "Application queue",
    href: "/applications",
    description: "Move applicants through CasaX review and onboarding.",
    icon: ListChecks,
  },
  {
    label: "Resident onboarding",
    href: "/residents/onboard",
    description: "Track approved applicants before move-in completion.",
    icon: Users,
  },
];

export default function AdminDashboardPage() {
  const summary = useQuery({
    queryKey: ["admin", "dashboard-summary"],
    queryFn: getAdminDashboardSummary,
  });
  const data = summary.data ?? emptySummary;

  const primaryMetrics = [
    { label: "Total Properties", value: data.totalProperties },
    { label: "Total units", value: data.totalUnits },
    { label: "Occupied units", value: data.occupiedUnits },
    { label: "Vacant units", value: data.vacantUnits },
    { label: "Active residents", value: data.activeResidents },
    {
      label: "Pending remittances",
      value: formatCurrency(data.pendingRemittancesAmount),
    },
    { label: "Rent collected", value: formatCurrency(data.rentCollected) },
    { label: "Lease renewals due", value: data.leaseRenewalsDue },
  ];

  const pipelineMetrics = [
    { label: "Live vacancies", value: data.liveRentalListings },
    { label: "Pending inspections", value: data.pendingInspections },
    { label: "Applications in review", value: data.applicationsInReview },
    {
      label: "Pending resident onboarding",
      value: data.pendingResidentOnboarding,
    },
  ];

  const financeMetrics = [
    {
      label: "Rent collected",
      value: formatCurrency(data.rentCollected),
    },
    {
      label: "Pending remittances",
      value: formatCurrency(data.pendingRemittancesAmount),
    },
    {
      label: "Completed remittances",
      value: formatCurrency(data.completedRemittancesAmount),
    },
    {
      label: "Failed remittances",
      value: String(data.failedRemittancesCount),
    },
  ];

  return (
    <main className="p-5 lg:p-8">
      <div>
        <p className="text-sm text-slate-500">Internal operations console</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          CasaX Operations Overview
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Monitor operational health across landlords, properties, units,
          rental listings, applicants, residents, rent collection, and
          remittances.
        </p>
      </div>

      {summary.isError ? (
        <p className="mt-6 rounded-xl bg-orange-50 p-4 text-sm text-orange-700">
          Unable to load live operations summary. Showing safe zero values.
        </p>
      ) : null}

      <DashboardSection
        description={`Portfolio coverage, resident occupancy, rent collection, and payout visibility. Occupancy rate: ${data.occupancyRate}%.`}
        isLoading={summary.isLoading}
        metrics={primaryMetrics}
        title="Primary Operations KPIs"
      />

      <DashboardSection
        description="Listing demand, inspections, applications, and conversion queue."
        isLoading={summary.isLoading}
        metrics={pipelineMetrics}
        title="Secondary Pipeline"
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Finance Snapshot</h2>
              <p className="mt-1 text-sm text-slate-500">
                Rent collection and landlord payout visibility.
              </p>
            </div>
            <Landmark className="size-5 text-slate-400" />
          </div>
          <div className="mt-6 space-y-3">
            {financeMetrics.map((metric) => (
              <FinanceRow
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>
          <Button asChild className="mt-6 w-full" variant="outline">
            <Link href="/payments">Open Payments & Remittances</Link>
          </Button>
        </Card>

        <Card>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-950">
                Operations Pipeline
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The core CasaX flow from setup to resident onboarding.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/property-setup">Open setup</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {pipelineItems.map(({ label, href, description, icon: Icon }) => (
              <Link
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"
                href={href}
                key={href}
              >
                <Icon className="size-5 text-emerald-700" />
                <p className="mt-4 font-semibold text-slate-950">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

function DashboardSection({
  title,
  description,
  metrics,
  isLoading,
}: {
  title: string;
  description: string;
  metrics: { label: string; value: string | number }[];
  isLoading: boolean;
}) {
  return (
    <section className="mt-8">
      <div>
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            {isLoading ? (
              <div className="mt-4 h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {metric.value}
              </p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}
