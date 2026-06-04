"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  DoorOpen,
  Search,
  Users,
} from "lucide-react";
import type { Property, Unit } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { useLandlordSummary, useProperties } from "@/features/properties/queries";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { PageHeader } from "@/components/operations/page-header";
import { StatusBadge } from "@/components/operations/status-badge";
import { useSubscriptionUsage } from "@/features/subscriptions/queries";
import { useLandlordRemittances } from "@/features/finance/queries";
import { getPropertyUnits } from "@/services/properties";
import { getPropertyLifecycleStatus } from "@/lib/property-lifecycle";

type StatusFilter =
  | "all"
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "live";
type SortMode = "default" | "occupancy_high" | "occupancy_low" | "rent_high" | "rent_low";

type PortfolioRow = {
  property: Property;
  units: Unit[];
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  annualRentRoll: number;
  pendingRemittance: number;
  status: ReturnType<typeof getPropertyLifecycleStatus>;
};

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const properties = useProperties(submittedSearch);
  const usage = useSubscriptionUsage();
  const summary = useLandlordSummary();
  const remittances = useLandlordRemittances();
  const propertyItems = properties.data?.items ?? [];
  const unitQueries = useQueries({
    queries: propertyItems.map((property) => ({
      queryKey: ["properties", property.id, "units"],
      queryFn: () => getPropertyUnits(property.id),
      enabled: Boolean(property.id),
    })),
  });
  const locations = Array.from(
    new Set(propertyItems.map((property) => `${property.city}, ${property.state}`)),
  ).sort();
  const rows = propertyItems
    .map((property, index): PortfolioRow => {
      const units = unitQueries[index]?.data ?? [];
      const occupiedUnits = units.filter((unit) => unit.status === "occupied").length;
      const vacantUnits = units.filter((unit) => unit.status === "vacant").length;
      const occupancyRate = units.length
        ? Math.round((occupiedUnits / units.length) * 100)
        : 0;
      const annualRentRoll = units.reduce(
        (total, unit) => total + annualRent(unit),
        0,
      );
      const pendingRemittance =
        remittances.data?.items
          .filter(
            (record) =>
              record.propertyId === property.id &&
              ["pending", "approved", "processing"].includes(record.status),
          )
          .reduce((total, record) => total + record.netAmount, 0) ?? 0;

      return {
        property,
        units,
        occupiedUnits,
        vacantUnits,
        occupancyRate,
        annualRentRoll,
        pendingRemittance,
        status: getPropertyLifecycleStatus(property),
      };
    })
    .filter((row) => statusFilter === "all" || row.status === statusFilter)
    .filter(
      (row) =>
        !locationFilter ||
        `${row.property.city}, ${row.property.state}` === locationFilter,
    )
    .sort((left, right) => {
      if (sortMode === "occupancy_high") {
        return right.occupancyRate - left.occupancyRate;
      }
      if (sortMode === "occupancy_low") {
        return left.occupancyRate - right.occupancyRate;
      }
      if (sortMode === "rent_high") {
        return right.annualRentRoll - left.annualRentRoll;
      }
      if (sortMode === "rent_low") {
        return left.annualRentRoll - right.annualRentRoll;
      }
      return left.property.name.localeCompare(right.property.name);
    });
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Properties"
        title="Portfolio oversight"
        description="Property records submitted for CasaX review, verification, and managed operations."
        action={
          <Button asChild variant="outline">
            <Link href="/support">Request Update</Link>
          </Button>
        }
      />
      {usage.data ? (
        <Card className="mt-6 border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
          CasaX Operations creates and configures property records internally.
          This workspace provides portfolio visibility and status tracking.
        </Card>
      ) : null}
      <form className="mt-8 flex max-w-xl gap-3" onSubmit={submitSearch}>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search property, city, or address"
          value={search}
        />
        <Button variant="outline" type="submit">
          Search
        </Button>
      </form>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <PortfolioMetric
          icon={Building2}
          label="Properties"
          value={summary.data?.totalProperties ?? properties.data?.items.length}
        />
        <PortfolioMetric
          icon={DoorOpen}
          label="Total Units"
          value={summary.data?.totalUnits}
        />
        <PortfolioMetric
          icon={Users}
          label="Occupied Units"
          value={summary.data?.occupiedUnits}
        />
        <PortfolioMetric
          icon={DoorOpen}
          label="Vacant Units"
          value={summary.data?.vacantUnits}
        />
        <PortfolioMetric
          icon={ArrowRight}
          label="Occupancy Rate"
          value={
            summary.data?.totalUnits
              ? `${Math.round(
                  (summary.data.occupiedUnits / summary.data.totalUnits) * 100,
                )}%`
              : "0%"
          }
        />
      </section>

      <section className="mt-7">
        {properties.isLoading ? <LoadingCards /> : null}
        {properties.isError ? (
          <ErrorState
            title="Unable to load properties"
            onRetry={() => void properties.refetch()}
          />
        ) : null}
        {properties.data?.items.length === 0 ? (
          submittedSearch ? (
            <Card className="py-14 text-center">
              <h2 className="font-semibold">No properties match your search</h2>
              <p className="mt-2 text-sm text-slate-500">
                Try another location or property name.
              </p>
            </Card>
          ) : (
            <Card className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50">
                <Building2 className="size-6 text-emerald-700" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">
                No portfolio records yet
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                CasaX Operations will create and prepare property records after
                assessment and onboarding.
              </p>
              <Button asChild className="mt-7" variant="outline">
                <Link href="/support">Contact CasaX</Link>
              </Button>
            </Card>
          )
        ) : null}
        {properties.data?.items.length ? (
          <PortfolioTable
            locationFilter={locationFilter}
            locations={locations}
            onLocationChange={setLocationFilter}
            onSortChange={setSortMode}
            onStatusChange={setStatusFilter}
            rows={rows}
            sortMode={sortMode}
            statusFilter={statusFilter}
          />
        ) : null}
      </section>
    </main>
  );
}

function PortfolioTable({
  locationFilter,
  locations,
  onLocationChange,
  onSortChange,
  onStatusChange,
  rows,
  sortMode,
  statusFilter,
}: {
  locationFilter: string;
  locations: string[];
  onLocationChange: (value: string) => void;
  onSortChange: (value: SortMode) => void;
  onStatusChange: (value: StatusFilter) => void;
  rows: PortfolioRow[];
  sortMode: SortMode;
  statusFilter: StatusFilter;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <Filter label="Status">
            <select
              onChange={(event) =>
                onStatusChange(event.target.value as StatusFilter)
              }
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="approved">Approved</option>
              <option value="live">Live</option>
            </select>
          </Filter>
          <Filter label="Location">
            <select
              onChange={(event) => onLocationChange(event.target.value)}
              value={locationFilter}
            >
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="Sort">
            <select
              onChange={(event) => onSortChange(event.target.value as SortMode)}
              value={sortMode}
            >
              <option value="default">Property name</option>
              <option value="occupancy_high">Occupancy: high to low</option>
              <option value="occupancy_low">Occupancy: low to high</option>
              <option value="rent_high">Annual rent roll: high to low</option>
              <option value="rent_low">Annual rent roll: low to high</option>
            </select>
          </Filter>
        </div>
      </div>

      {rows.length ? (
        <>
          <div className="hidden grid-cols-[1.4fr_1fr_70px_80px_70px_90px_120px_140px_120px_90px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 xl:grid">
            <span>Property</span>
            <span>Location</span>
            <span>Units</span>
            <span>Occupied</span>
            <span>Vacant</span>
            <span>Occupancy %</span>
            <span>Annual rent roll</span>
            <span>Pending Remittance</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <PortfolioTableRow key={row.property.id} row={row} />
            ))}
          </div>
        </>
      ) : (
        <div className="py-14 text-center">
          <Search className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-4 font-semibold text-slate-950">
            No properties match these filters
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Adjust status, location, or search to review more portfolio records.
          </p>
        </div>
      )}
    </Card>
  );
}

function PortfolioTableRow({ row }: { row: PortfolioRow }) {
  const propertyHref = `/portfolio/${row.property.id}`;

  return (
    <Link
      className="block px-5 py-5 transition hover:bg-emerald-50/30 xl:grid xl:grid-cols-[1.4fr_1fr_70px_80px_70px_90px_120px_140px_120px_90px] xl:items-center xl:gap-4"
      href={propertyHref}
    >
      <div className="flex items-start justify-between gap-4 xl:block">
        <div>
          <p className="font-semibold text-slate-950">{row.property.name}</p>
          <p className="mt-1 text-xs text-slate-500">{row.property.type}</p>
        </div>
        <div className="xl:hidden">
          <StatusBadge status={row.status} />
        </div>
      </div>

      <Cell label="Location" value={`${row.property.city}, ${row.property.state}`} />
      <Cell label="Units" value={row.property._count.units} />
      <Cell label="Occupied" value={row.occupiedUnits} />
      <Cell label="Vacant" value={row.vacantUnits} />
      <Cell label="Occupancy %" value={`${row.occupancyRate}%`} />
      <Cell label="Annual rent roll" value={formatCurrency(row.annualRentRoll)} />
      <Cell
        label="Pending Remittance"
        value={formatCurrency(row.pendingRemittance)}
      />
      <div className="mt-4 hidden xl:mt-0 xl:block">
        <StatusBadge status={row.status} />
      </div>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 xl:mt-0">
        Open <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}

function Cell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm xl:mt-0 xl:block">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 xl:hidden">
        {label}
      </span>
      <span className="font-medium text-slate-700 xl:text-slate-600">{value}</span>
    </div>
  );
}

function PortfolioMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value?: number | string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <Icon className="size-4 text-emerald-700" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">
        {value ?? "--"}
      </p>
    </Card>
  );
}

function Filter({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid flex-1 gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
      {label}
      <div className="[&_select]:h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:font-medium [&_select]:text-slate-700">
        {children}
      </div>
    </label>
  );
}

function annualRent(unit: Unit) {
  return unit.activeTenancy?.rentAmount ?? unit.rentAmount;
}
