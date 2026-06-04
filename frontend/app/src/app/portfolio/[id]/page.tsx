"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Building2,
  ClipboardCheck,
  DoorOpen,
  ReceiptText,
  Wrench,
  Users,
} from "lucide-react";
import type { ApplicationStatus, TenancyStatus, Unit, UnitStatus } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useApplications } from "@/features/operations/queries";
import { useLandlordRemittances, usePayments } from "@/features/finance/queries";
import { useProperty, usePropertyUnits } from "@/features/properties/queries";
import { getPropertyLifecycleStatus } from "@/lib/property-lifecycle";

type VisibilityStatus = ApplicationStatus | TenancyStatus | UnitStatus;

export default function PortfolioPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const property = useProperty(id);
  const units = usePropertyUnits(id);
  const payments = usePayments({ propertyId: id });
  const remittances = useLandlordRemittances();
  const applications = useApplications("");

  if (property.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }

  if (property.isError || !property.data) {
    return (
      <main className="p-5 lg:p-8">
        <ErrorState
          title="Unable to load portfolio record"
          onRetry={() => void property.refetch()}
        />
      </main>
    );
  }

  const record = property.data;
  const unitRecords = units.data ?? [];
  const occupiedUnits = unitRecords.filter((unit) => unit.status === "occupied");
  const vacantUnits = unitRecords.filter((unit) => unit.status === "vacant");
  const occupancyRate = unitRecords.length
    ? Math.round((occupiedUnits.length / unitRecords.length) * 100)
    : 0;
  const annualRentRoll = unitRecords.reduce(
    (total, unit) => total + annualRent(unit),
    0,
  );
  const propertyPayments = payments.data?.items ?? [];
  const pendingRemittance =
    remittances.data?.items
      .filter(
        (item) =>
          item.propertyId === id &&
          ["pending", "approved", "processing"].includes(item.status),
      )
      .reduce((total, item) => total + item.netAmount, 0) ?? 0;
  const propertyApplications =
    applications.data?.items.filter((item) => item.propertyId === id) ?? [];
  const activeVacancies = vacantUnits.length;

  const timeline = [
    {
      title: "Property submitted",
      detail: `${record.name} entered CasaX review.`,
      date: record.createdAt,
    },
    {
      title:
        record.verificationStatus === "verified"
          ? "Property approved"
          : "Property review active",
      detail:
        record.verificationStatus === "verified"
          ? "CasaX has verified this property record."
          : "CasaX review and verification are in progress.",
      date: record.updatedAt,
    },
    {
      title: "Vacancy visibility",
      detail: `${activeVacancies} vacant unit${
        activeVacancies === 1 ? "" : "s"
      } monitored for vacancy operations.`,
      date: record.updatedAt,
    },
    {
      title: "Resident onboarding",
      detail: `${occupiedUnits.length} active resident${
        occupiedUnits.length === 1 ? "" : "s"
      } currently visible.`,
      date: record.updatedAt,
    },
    {
      title: "Rent collection",
      detail: `${propertyPayments.length} rent collection record${
        propertyPayments.length === 1 ? "" : "s"
      } available.`,
      date: record.updatedAt,
    },
    {
      title: "Remittance tracking",
      detail: `${formatCurrency(pendingRemittance)} pending landlord payout.`,
      date: record.updatedAt,
    },
  ];

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Property portfolio"
        title={record.name}
        description={`${record.address}, ${record.city}, ${record.state}`}
        backHref="/properties"
        action={
          <Button asChild variant="outline">
            <Link href={`/properties/${record.id}`}>Open property details</Link>
          </Button>
        }
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <Kpi label="Total units" value={unitRecords.length} icon={DoorOpen} />
        <Kpi label="Occupied units" value={occupiedUnits.length} icon={Users} />
        <Kpi label="Vacant units" value={vacantUnits.length} icon={DoorOpen} />
        <Kpi label="Occupancy rate" value={`${occupancyRate}%`} icon={Activity} />
        <Kpi label="Active residents" value={occupiedUnits.length} icon={Users} />
        <Kpi
          label="Annual rent roll"
          value={formatCurrency(annualRentRoll)}
          icon={ReceiptText}
        />
        <Kpi
          label="Pending remittance"
          value={formatCurrency(pendingRemittance)}
          icon={ReceiptText}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <SectionHeader
              icon={Building2}
              title="Overview"
              detail="CasaX lifecycle, location, and operating status."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Type" value={record.type} />
              <Detail label="Status" value={<StatusBadge status={record.status} />} />
              <Detail
                label="CasaX lifecycle"
                value={<StatusBadge status={getPropertyLifecycleStatus(record)} />}
              />
              <Detail label="Location" value={`${record.city}, ${record.state}`} />
            </div>
          </Card>

          <Card>
            <SectionHeader
              icon={DoorOpen}
              title="Units"
              detail="Unit inventory, readiness, and occupancy visibility."
            />
            {units.isLoading ? <LoadingCards /> : null}
            {units.isError ? (
              <ErrorState
                title="Unable to load units"
                onRetry={() => void units.refetch()}
              />
            ) : null}
            {unitRecords.length ? (
              <div className="mt-5 space-y-5">
                {groupUnitsByType(unitRecords).map(([unitType, groupedUnits]) => (
                  <div key={unitType}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-950">
                        {unitType}
                      </h3>
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                        {groupedUnits.length} generated unit
                        {groupedUnits.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {groupedUnits.map((unit) => (
                        <UnitVisibilityCard key={unit.id} unit={unit} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card>
            <SectionHeader
              icon={Users}
              title="Residents"
              detail="Approved residents and lease visibility."
            />
            <VisibilityRows
              empty="No active residents are visible for this property yet."
              rows={occupiedUnits.map((unit) => ({
                href: unit.activeTenancy
                  ? `/tenancies/${unit.activeTenancy.id}`
                  : `/units/${unit.id}`,
                title: occupantName(unit),
                detail: `${unit.name} / lease ends ${
                  unit.activeTenancy
                    ? formatDate(unit.activeTenancy.endDate)
                    : "not available"
                }`,
                status: unit.activeTenancy?.status ?? unit.status,
              }))}
            />
          </Card>

          <Card>
            <SectionHeader
              icon={ClipboardCheck}
              title="Vacancies"
              detail="Vacant units, applicant interest, and onboarding progress."
            />
            <VisibilityRows
              empty="No vacancy activity is visible for this property yet."
              rows={propertyApplications.map((application) => ({
                href: `/applications/${application.id}`,
                title: application.unit.name,
                detail: `${application.applicant.user.email} / ${application.unit.unitType}`,
                status: application.status,
              }))}
            />
          </Card>

          <Card>
            <SectionHeader
              icon={ReceiptText}
              title="Rent & Remittance"
              detail="Rent collection records and pending landlord payouts."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Detail
                label="Annual rent roll"
                value={formatCurrency(annualRentRoll)}
              />
              <Detail
                label="Collected records"
                value={propertyPayments.filter((item) => item.status === "paid").length}
              />
              <Detail
                label="Pending remittance"
                value={formatCurrency(pendingRemittance)}
              />
            </div>
          </Card>

          <Card>
            <SectionHeader
              icon={Wrench}
              title="Maintenance"
              detail="Tenant issues and CasaX coordination status for this property."
            />
            <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              Maintenance requests for this property will appear here with
              issue, unit, status, and CasaX coordination updates.
            </div>
          </Card>
        </div>

        <Card>
          <SectionHeader
            icon={Activity}
            title="Activity Timeline"
            detail="Key operating events for this property."
          />
          <div className="mt-6 space-y-5">
            {timeline.map((item) => (
              <div className="flex gap-3" key={item.title}>
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Activity className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.detail}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(item.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DoorOpen;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <Icon className="size-4 text-emerald-700" />
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </Card>
  );
}

function SectionHeader({
  detail,
  icon: Icon,
  title,
}: {
  detail: string;
  icon: typeof DoorOpen;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-emerald-700">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function UnitVisibilityCard({ unit }: { unit: Unit }) {
  return (
    <Link
      className="rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30"
      href={`/units/${unit.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{unit.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {unit.unitType} / {unit.bedroomCount} bed
          </p>
        </div>
        <StatusBadge status={unit.status} />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {unit.status === "occupied"
          ? `${occupantName(unit)} / ${formatCurrency(unit.activeTenancy?.rentAmount ?? unit.rentAmount)} annual rent`
          : `${formatCurrency(unit.rentAmount)} annual rent`}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Lease end:{" "}
        {unit.activeTenancy ? formatDate(unit.activeTenancy.endDate) : "--"}
      </p>
    </Link>
  );
}

function VisibilityRows({
  empty,
  rows,
}: {
  empty: string;
  rows: {
    detail: string;
    href: string;
    status: VisibilityStatus;
    title: string;
  }[];
}) {
  if (!rows.length) {
    return (
      <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="mt-5 divide-y divide-slate-100">
      {rows.map((row) => (
        <Link
          className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          href={row.href}
          key={`${row.href}-${row.title}`}
        >
          <span>
            <span className="block text-sm font-semibold text-slate-950">
              {row.title}
            </span>
            <span className="mt-1 block text-sm text-slate-500">{row.detail}</span>
          </span>
          <StatusBadge status={row.status} />
        </Link>
      ))}
    </div>
  );
}

function annualRent(unit: Unit) {
  return unit.activeTenancy?.rentAmount ?? unit.rentAmount;
}

function groupUnitsByType(units: Unit[]) {
  const groups = new Map<string, Unit[]>();
  units.forEach((unit) => {
    groups.set(unit.unitType, [...(groups.get(unit.unitType) ?? []), unit]);
  });
  return Array.from(groups.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  );
}

function occupantName(unit: Unit) {
  const profile = unit.activeOccupant?.profile;
  if (profile) return `${profile.firstName} ${profile.lastName}`;
  return unit.activeOccupant?.email ?? "Resident details pending";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
