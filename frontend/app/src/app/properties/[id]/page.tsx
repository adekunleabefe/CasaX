"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Building2,
  DoorOpen,
  FileText,
  LayoutGrid,
  List,
  MapPin,
  PencilLine,
  Plus,
  ReceiptText,
  RefreshCw,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { PropertyInput, Unit } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { cn, formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { PropertyForm } from "@/components/operations/property-form";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import {
  useDeleteProperty,
  useProperty,
  usePropertyUnits,
  useUpdateUnit,
  useUpdateProperty,
} from "@/features/properties/queries";
import { useTerminateTenancy } from "@/features/tenancies/queries";

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const property = useProperty(id);
  const units = usePropertyUnits(id);
  const update = useUpdateProperty(id);
  const remove = useDeleteProperty();
  const [editing, setEditing] = useState(false);
  const [unitView, setUnitView] = useState<"cards" | "list">("cards");

  async function updateProperty(values: PropertyInput) {
    await update.mutateAsync(values);
    setEditing(false);
  }

  async function deleteProperty() {
    if (!window.confirm("Remove this property from active operations?")) return;
    await remove.mutateAsync(id);
    router.push("/properties");
  }

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
          title="Unable to load this property"
          onRetry={() => void property.refetch()}
        />
      </main>
    );
  }

  const record = property.data;

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Property record"
        title={record.name}
        description={`${record.address}, ${record.city}, ${record.state}`}
        backHref="/properties"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={record.status} />
            {editing ? (
              <Button
                onClick={() => {
                  update.reset();
                  setEditing(false);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            ) : (
              <Button onClick={() => setEditing(true)} variant="outline">
                <PencilLine className="mr-2 size-4" />
                Edit property
              </Button>
            )}
            <Button
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
              disabled={remove.isPending}
              onClick={() => void deleteProperty()}
              variant="outline"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="mt-10 space-y-10">
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Property details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Operational identity and location for this property.
            </p>
          </div>
          {editing ? (
            <div className="max-w-2xl">
              <PropertyForm
                error={update.error?.message}
                initialValues={{
                  name: record.name,
                  address: record.address,
                  city: record.city,
                  state: record.state,
                  type: record.type,
                  status: record.status,
                }}
                isPending={update.isPending}
                onSubmit={updateProperty}
                submitLabel="Save changes"
              />
            </div>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-5 sm:px-7">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                  <Building2 className="size-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Property record
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Key operating information at a glance.
                  </p>
                </div>
              </div>
              <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-6">
                <Detail
                  className="sm:col-span-2 lg:col-span-2"
                  label="Property name"
                  value={record.name}
                />
                <Detail label="Property type" value={record.type} />
                <Detail
                  label="Operational status"
                  value={<StatusBadge status={record.status} />}
                />
                <Detail
                  className="sm:col-span-2 lg:col-span-2"
                  label="Street address"
                  value={record.address}
                />
                <Detail
                  className="lg:col-span-3"
                  label="City"
                  value={record.city}
                />
                <Detail
                  className="lg:col-span-3"
                  label="State"
                  value={record.state}
                />
              </div>
            </Card>
          )}
        </section>

        <section>
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-xl font-semibold">Units management</h2>
              <p className="mt-1 text-sm text-slate-500">
                {record._count.units} registered units
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                aria-label="Unit view"
                className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
                role="group"
              >
                <button
                  aria-pressed={unitView === "cards"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    unitView === "cards"
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                  onClick={() => setUnitView("cards")}
                  type="button"
                >
                  <LayoutGrid className="size-3.5" />
                  Cards
                </button>
                <button
                  aria-pressed={unitView === "list"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    unitView === "list"
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                  onClick={() => setUnitView("list")}
                  type="button"
                >
                  <List className="size-3.5" />
                  List
                </button>
              </div>
              <Button asChild variant="outline">
                <Link href={`/properties/${id}/caretakers`}>
                  <UsersRound className="mr-2 size-4" /> Caretakers
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/properties/${id}/units/new`}>
                  <Plus className="mr-2 size-4" /> Add unit
                </Link>
              </Button>
            </div>
          </div>
          {units.isLoading ? <LoadingCards /> : null}
          {units.isError ? (
            <ErrorState
              title="Unable to load units"
              onRetry={() => void units.refetch()}
            />
          ) : null}
          {units.data?.length ? (
            unitView === "cards" ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {units.data.map((unit) => (
                  <UnitCard key={unit.id} unit={unit} />
                ))}
              </div>
            ) : (
              <UnitList units={units.data} />
            )
          ) : !units.isLoading && !units.isError ? (
            <Card className="py-12 text-center">
              <DoorOpen className="mx-auto size-7 text-slate-400" />
              <h3 className="mt-4 font-semibold">No units registered</h3>
              <p className="mt-2 text-sm text-slate-500">
                Add units to begin tracking occupancy and vacancies.
              </p>
            </Card>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function UnitCard({ unit }: { unit: Unit }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
          <DoorOpen className="size-5 text-slate-700" />
        </div>
        <StatusBadge status={unit.status} />
      </div>
      <h3 className="mt-5 font-semibold">{unit.name}</h3>
      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
        <MapPin className="size-4" />
        {unit.unitType} / {unit.bedroomCount} bed
      </p>
      <p className="mt-5 text-xl font-semibold">
        {formatCurrency(unit.rentAmount)}
        <span className="ml-1 text-xs font-normal text-slate-500">/ year</span>
      </p>
      {unit.status === "occupied" && unit.activeTenancy ? (
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Current occupant
          </p>
          <p className="mt-2 font-medium text-slate-900">
            {occupantName(unit)}
          </p>
          {occupantContact(unit) ? (
            <p className="mt-1 text-xs text-slate-500">
              {occupantContact(unit)}
            </p>
          ) : null}
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {formatCurrency(unit.activeTenancy.rentAmount)} /{" "}
            {unit.activeTenancy.paymentFrequency}
            <br />
            {formatDate(unit.activeTenancy.startDate)} -{" "}
            {formatDate(unit.activeTenancy.endDate)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={unit.activeTenancy.status} />
            {unit.agreementSummary ? (
              <StatusBadge status={unit.agreementSummary.status} />
            ) : null}
            {unit.latestPaymentSummary ? (
              <StatusBadge status={unit.latestPaymentSummary.status} />
            ) : null}
          </div>
        </div>
      ) : null}
      {unit.status === "vacant" || unit.status === "pending_approval" ? (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Add a new or existing tenant to this unit.
        </p>
      ) : null}
      <UnitActions className="mt-5" unit={unit} />
    </Card>
  );
}

function UnitList({ units }: { units: Unit[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden grid-cols-[minmax(112px,1.2fr)_minmax(96px,1fr)_80px_minmax(118px,1fr)_minmax(116px,1fr)_minmax(100px,1fr)_minmax(190px,1.4fr)] gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 xl:grid">
        <span>Unit</span>
        <span>Type</span>
        <span>Bedrooms</span>
        <span>Rent</span>
        <span>Status</span>
        <span>Occupant</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-slate-100">
        {units.map((unit) => (
          <div key={unit.id}>
            <div className="hidden grid-cols-[minmax(112px,1.2fr)_minmax(96px,1fr)_80px_minmax(118px,1fr)_minmax(116px,1fr)_minmax(100px,1fr)_minmax(190px,1.4fr)] items-center gap-4 px-6 py-5 xl:grid">
              <p className="font-semibold text-slate-950">{unit.name}</p>
              <p className="text-sm text-slate-600">{unit.unitType}</p>
              <p className="text-sm text-slate-600">{unit.bedroomCount}</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(unit.rentAmount)}
                <span className="ml-1 font-normal text-slate-400">/ year</span>
              </p>
              <StatusBadge status={unit.status} />
              <div>
                <p className="text-sm text-slate-600">{occupantName(unit)}</p>
                {unit.activeTenancy ? (
                  <p className="mt-1 text-xs text-slate-400">
                    To {formatDate(unit.activeTenancy.endDate)}
                  </p>
                ) : null}
              </div>
              <UnitActions unit={unit} />
            </div>

            <div className="p-5 xl:hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{unit.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{unit.unitType}</p>
                </div>
                <StatusBadge status={unit.status} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                <ListDetail label="Bedrooms" value={`${unit.bedroomCount}`} />
                <ListDetail
                  label="Rent"
                  value={`${formatCurrency(unit.rentAmount)} / year`}
                />
                <ListDetail label="Occupant" value={occupantName(unit)} />
              </div>
              {unit.activeTenancy ? (
                <p className="mt-3 text-xs text-slate-500">
                  Lease period: {formatDate(unit.activeTenancy.startDate)} -{" "}
                  {formatDate(unit.activeTenancy.endDate)}
                </p>
              ) : null}
              <UnitActions className="mt-5" unit={unit} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UnitActions({ unit, className }: { unit: Unit; className?: string }) {
  const update = useUpdateUnit(unit.id, unit.propertyId);
  const tenancyId = unit.activeTenancy?.id ?? "";
  const terminate = useTerminateTenancy(tenancyId, unit.id, unit.propertyId);

  async function publishVacancy() {
    try {
      await update.mutateAsync({
        name: unit.name,
        rentAmount: unit.rentAmount,
        bedroomCount: unit.bedroomCount,
        unitType: unit.unitType,
        status: unit.status,
        isPubliclyVisible: true,
      });
    } catch {
      // Action feedback is rendered immediately below the unit actions.
    }
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}
    >
      {(unit.status === "vacant" || unit.status === "pending_approval") && (
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
          href={`/units/${unit.id}/add-tenant`}
        >
          <UserPlus className="size-4" />
          Add tenant
        </Link>
      )}
      {unit.status === "vacant" && !unit.isPubliclyVisible ? (
        <button
          className="inline-flex text-sm font-medium text-emerald-700"
          disabled={update.isPending}
          onClick={() => void publishVacancy()}
          type="button"
        >
          Publish vacancy
        </button>
      ) : null}
      {unit.status === "occupied" && unit.activeTenancy ? (
        <Link
          className="inline-flex text-sm font-medium text-emerald-700"
          href={`/tenancies/${unit.activeTenancy.id}`}
        >
          View tenancy
        </Link>
      ) : null}
      {unit.status === "occupied" &&
      unit.agreementSummary &&
      unit.activeTenancy ? (
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
          href={`/payments/new?tenancyId=${unit.activeTenancy.id}`}
        >
          <ReceiptText className="size-4" />
          Record payment
        </Link>
      ) : null}
      {unit.status === "occupied" && unit.renewableTenancyId ? (
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
          href={`/tenancies/${unit.renewableTenancyId}/renew`}
        >
          <RefreshCw className="size-4" />
          Renew tenancy
        </Link>
      ) : null}
      {unit.status === "occupied" && unit.activeTenancy?.status === "active" ? (
        <button
          className="inline-flex text-sm font-medium text-orange-700"
          disabled={terminate.isPending}
          onClick={() => {
            const reason =
              window.prompt("Reason for termination (optional)") ?? undefined;
            terminate.mutate(reason);
          }}
          type="button"
        >
          Terminate tenancy
        </button>
      ) : null}
      {unit.status === "occupied" &&
      unit.agreementSummary &&
      unit.activeTenancy ? (
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"
          href={`/tenancies/${unit.activeTenancy.id}#agreement`}
        >
          <FileText className="size-4" />
          View agreement
        </Link>
      ) : null}
      <Link
        className="inline-flex text-sm font-medium text-slate-500"
        href={`/units/${unit.id}`}
      >
        Manage unit
      </Link>
      {update.error || terminate.error ? (
        <p className="w-full text-xs text-orange-700">
          {(update.error ?? terminate.error)?.message}
        </p>
      ) : null}
    </div>
  );
}

function ListDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function occupantName(unit: Unit) {
  if (!unit.activeOccupant) return "-";
  if (unit.activeOccupant.profile) {
    return `${unit.activeOccupant.profile.firstName} ${unit.activeOccupant.profile.lastName}`;
  }
  return unit.activeOccupant.email;
}

function occupantContact(unit: Unit) {
  return unit.activeOccupant?.profile?.phone ?? unit.activeOccupant?.email;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function Detail({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white px-6 py-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="mt-3 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}
