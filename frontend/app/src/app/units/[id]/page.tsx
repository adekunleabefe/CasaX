"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CalendarRange,
  FileText,
  Mail,
  PencilLine,
  Phone,
  ReceiptText,
  RefreshCw,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import type { Unit, UnitInput } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { UnitForm } from "@/components/operations/unit-form";
import { useCurrentUser } from "@/features/auth/queries";
import {
  useDeleteUnit,
  useUnit,
  useUpdateUnit,
} from "@/features/properties/queries";

export default function UnitDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const unit = useUnit(id);
  const propertyId = unit.data?.propertyId;
  const update = useUpdateUnit(id, propertyId);
  const remove = useDeleteUnit(propertyId);
  const [editing, setEditing] = useState(false);

  async function updateUnit(values: UnitInput) {
    await update.mutateAsync(values);
    setEditing(false);
  }

  async function deleteUnit() {
    if (!window.confirm("Remove this unit from active review?")) return;
    await remove.mutateAsync(id);
    router.push(propertyId ? `/properties/${propertyId}` : "/properties");
  }

  if (unit.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }
  if (unit.isError || !unit.data) {
    return (
      <main className="p-5 lg:p-8">
        <ErrorState
          title="Unable to load this unit"
          onRetry={() => void unit.refetch()}
        />
      </main>
    );
  }

  const record = unit.data;
  const parent = record.property;
  const tenancy = record.activeTenancy;
  const occupant = record.activeOccupant;
  const isLandlord = currentUser.data?.role === "landlord";
  const canRecordPayment = isLandlord || currentUser.data?.role === "caretaker";
  const isOccupied = record.status === "occupied";
  const occupantName = occupant?.profile
    ? `${occupant.profile.firstName} ${occupant.profile.lastName}`
    : (occupant?.email ?? "Occupant not available");

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Unit record"
        title={record.name}
        description={
          parent
            ? `${parent.name} / ${parent.city}, ${parent.state}`
            : "Review unit readiness and vacancy status."
        }
        backHref={
          isLandlord
            ? `/properties/${record.propertyId}`
            : "/tenant-onboarding-requests"
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={record.status} />
            {isLandlord ? (
              <>
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
                    Edit unit
                  </Button>
                )}
                <Button
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  disabled={remove.isPending}
                  onClick={() => void deleteUnit()}
                  variant="outline"
                >
                  <Trash2 className="mr-2 size-4" />
                  Archive
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="mt-10 space-y-8">
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Unit details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review identity, rent terms, and vacancy readiness for this unit.
            </p>
          </div>
          {editing && isLandlord ? (
            <UnitForm
              error={update.error?.message ?? remove.error?.message}
              initialValues={{
                name: record.name,
                rentAmount: record.rentAmount,
                bedroomCount: record.bedroomCount,
                unitType: record.unitType,
                status: record.status,
                isPubliclyVisible: record.isPubliclyVisible,
              }}
              isPending={update.isPending}
              onSubmit={updateUnit}
              submitLabel="Save unit"
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-5">
                <Detail label="Unit" value={record.name} />
                <Detail label="Unit type" value={record.unitType} />
                <Detail label="Bedrooms" value={`${record.bedroomCount}`} />
                <Detail
                  label="Annual rent"
                  value={formatCurrency(record.rentAmount)}
                />
                <Detail
                  label="Vacancy publishing"
                  value={record.isPubliclyVisible ? "Published" : "Private"}
                />
              </div>
            </Card>
          )}
        </section>

        {isOccupied ? (
          <CurrentOccupantCard
            canRecordPayment={canRecordPayment}
            isLandlord={isLandlord}
            occupantEmail={occupant?.email}
            occupantName={occupantName}
            occupantPhone={occupant?.profile?.phone}
            payment={record.latestPaymentSummary}
            record={record}
            tenancy={tenancy}
          />
        ) : (
          <VacantUnitActions
            isLandlord={isLandlord}
            error={update.error?.message}
            isPublished={record.isPubliclyVisible}
            unitId={record.id}
          />
        )}

        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link
            className="text-emerald-700"
            href={`/units/${record.id}/occupancy-history`}
          >
            View occupancy history
          </Link>
          {parent && isLandlord ? (
            <Link
              className="text-emerald-700"
              href={`/properties/${parent.id}`}
            >
              Return to {parent.name}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function CurrentOccupantCard({
  canRecordPayment,
  isLandlord,
  occupantEmail,
  occupantName,
  occupantPhone,
  payment,
  record,
  tenancy,
}: {
  canRecordPayment: boolean;
  isLandlord: boolean;
  occupantEmail?: string;
  occupantName: string;
  occupantPhone?: string | null;
  payment: Unit["latestPaymentSummary"];
  record: Unit;
  tenancy: Unit["activeTenancy"];
}) {
  if (!tenancy) {
    return (
      <Card>
        <h2 className="font-semibold">Current occupant</h2>
        <p className="mt-3 text-sm text-slate-500">
          This unit is marked occupied, but no active tenancy summary is
          available.
        </p>
      </Card>
    );
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Current occupant</h2>
        <p className="mt-1 text-sm text-slate-500">
          Current tenancy, agreement, and rent visibility for this unit.
        </p>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-100 bg-slate-50/60 p-6 sm:flex-row sm:items-start">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
              <UserRound className="size-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Tenant
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                {occupantName}
              </h3>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                {occupantEmail ? (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="size-4" />
                    {occupantEmail}
                  </span>
                ) : null}
                {occupantPhone ? (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-4" />
                    {occupantPhone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <StatusBadge status={tenancy.status} />
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
          <Detail
            label="Rent terms"
            value={`${formatCurrency(tenancy.rentAmount)} / ${tenancy.paymentFrequency}`}
          />
          <Detail
            label="Tenancy dates"
            value={`${formatDate(tenancy.startDate)} - ${formatDate(tenancy.endDate)}`}
          />
          <Detail
            label="Agreement status"
            value={
              record.agreementSummary ? (
                <StatusBadge status={record.agreementSummary.status} />
              ) : (
                "Not created"
              )
            }
          />
          <Detail
            label="Latest payment"
            value={
              payment ? (
                <span className="inline-flex flex-col gap-2">
                  <StatusBadge status={payment.status} />
                  <span className="text-xs font-normal text-slate-500">
                    {formatCurrency(payment.amount)}
                  </span>
                </span>
              ) : (
                "No payment recorded"
              )
            }
          />
        </div>
        <div className="flex flex-wrap gap-3 border-t border-slate-100 px-6 py-5">
          <Button asChild variant="outline">
            <Link href={`/tenancies/${tenancy.id}`}>
              <CalendarRange className="mr-2 size-4" />
              View tenancy
            </Link>
          </Button>
          {canRecordPayment && record.agreementSummary ? (
            <Button asChild variant="outline">
              <Link href="/payments">
                <ReceiptText className="mr-2 size-4" />
                View rent records
              </Link>
            </Button>
          ) : null}
          {isLandlord &&
          (tenancy.status === "active" || tenancy.status === "expired") ? (
            <Button asChild variant="outline">
              <a href="mailto:hello@casax.ng?subject=Tenancy%20renewal%20request">
                <RefreshCw className="mr-2 size-4" />
                Request renewal
              </a>
            </Button>
          ) : null}
          {isLandlord && tenancy.status === "active" ? (
            <Button
              asChild
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
              variant="outline"
            >
              <a href="mailto:hello@casax.ng?subject=Tenancy%20termination%20request">
                Request termination
              </a>
            </Button>
          ) : null}
          {record.agreementSummary ? (
            <Button asChild variant="outline">
              <Link href={`/tenancies/${tenancy.id}#agreement`}>
                <FileText className="mr-2 size-4" />
                View agreement
              </Link>
            </Button>
          ) : null}
        </div>
      </Card>
    </section>
  );
}

function VacantUnitActions({
  error,
  isLandlord,
  isPublished,
  unitId,
}: {
  error?: string;
  isLandlord: boolean;
  isPublished: boolean;
  unitId: string;
}) {
  return (
    <Card className="border-emerald-100 bg-emerald-50/30">
      <UserPlus className="size-6 text-emerald-700" />
      <h2 className="mt-4 font-semibold">Ready for occupancy</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Submit tenant details for CasaX review, or request vacancy publishing
        when this unit is ready for applicants.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild>
          {isLandlord ? (
            <a href="mailto:hello@casax.ng?subject=Tenant%20onboarding%20request">
              Request tenant onboarding
            </a>
          ) : (
            <Link href={`/units/${unitId}/add-tenant`}>Submit tenant</Link>
          )}
        </Button>
        {isLandlord && !isPublished ? (
          <Button asChild variant="outline">
            <a href="mailto:hello@casax.ng?subject=Vacancy%20publishing%20request">
              Request vacancy publishing
            </a>
          </Button>
        ) : null}
        {isPublished ? (
          <span className="inline-flex items-center rounded-xl bg-white px-4 py-3 text-sm font-medium text-emerald-700">
            Vacancy published
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-orange-700">{error}</p> : null}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-white px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="mt-3 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
}
