"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, Plus, Search } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  createAdminProperty,
  getAdminLandlords,
  getAdminProperties,
  type AdminLandlordSummary,
  type AdminPropertyReview,
} from "@/services/operations";

const statusLabels = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Ready for review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Changes requested",
} as const;

export default function AdminPropertySetupPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const properties = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: getAdminProperties,
  });
  const landlords = useQuery({
    queryKey: ["admin", "landlords"],
    queryFn: getAdminLandlords,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (properties.data ?? []).filter((property) => {
      if (!term) return true;
      return [
        property.name,
        property.city,
        property.state,
        property.landlord.user.email,
        property.landlord.businessName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [properties.data, search]);

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX Operations"
        title="Property Setup"
        description="Create CasaX-managed property records, generate units from the submitted unit mix, and prepare vacancies for publishing."
        action={
          <Button onClick={() => setShowCreate((value) => !value)}>
            <Plus className="mr-2 size-4" />
            Create property
          </Button>
        }
      />

      {showCreate ? (
        <CreatePropertyCard
          landlords={landlords.data ?? []}
          onClose={() => setShowCreate(false)}
        />
      ) : null}

      <Card className="mt-8 border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="size-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search property, landlord, city, or state"
            value={search}
          />
        </div>
      </Card>

      <section className="mt-7">
        {properties.isLoading ? <LoadingCards /> : null}
        {properties.isError ? (
          <ErrorState
            title="Unable to load property setup records"
            onRetry={() => void properties.refetch()}
          />
        ) : null}
        {properties.isSuccess && rows.length === 0 ? (
          <Card className="py-14 text-center">
            <Building2 className="mx-auto size-8 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">
              No properties are being set up yet.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              CasaX Operations can create the first internal property setup
              record here.
            </p>
          </Card>
        ) : null}
        {rows.length ? <PropertySetupTable rows={rows} /> : null}
      </section>
    </main>
  );
}

function CreatePropertyCard({
  landlords,
  onClose,
}: {
  landlords: AdminLandlordSummary[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [unitMixRows, setUnitMixRows] = useState<UnitMixFormRow[]>([
    {
      id: 1,
      unitType: "Self-contained",
      quantity: 4,
      annualRent: 500000,
      prefix: "SC",
    },
  ]);
  const create = useMutation({
    mutationFn: createAdminProperty,
    onSuccess: async (property) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      window.location.href = `/property-setup/${property.id}`;
    },
  });
  const totalUnits = unitMixRows.reduce((total, row) => total + row.quantity, 0);
  const annualRentRoll = unitMixRows.reduce(
    (total, row) => total + row.quantity * row.annualRent,
    0,
  );

  function updateUnitMixRow(
    id: number,
    field: keyof Omit<UnitMixFormRow, "id">,
    value: string,
  ) {
    setUnitMixRows((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === "quantity" || field === "annualRent"
                  ? Number(value)
                  : value,
            }
          : row,
      ),
    );
  }

  function addUnitMixRow() {
    setUnitMixRows((rows) => [
      ...rows,
      {
        id: Date.now(),
        unitType: "",
        quantity: 1,
        annualRent: 0,
        prefix: "",
      },
    ]);
  }

  function removeUnitMixRow(id: number) {
    setUnitMixRows((rows) =>
      rows.length === 1 ? rows : rows.filter((row) => row.id !== id),
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const unitMix = unitMixRows
      .filter((row) => row.unitType.trim() && row.quantity > 0)
      .map((row) => ({
        unitType: row.unitType.trim(),
        quantity: row.quantity,
        annualRent: row.annualRent,
        prefix: row.prefix.trim() || undefined,
      }));
    create.mutate({
      landlordId: String(form.get("landlordId") ?? ""),
      name: String(form.get("name") ?? ""),
      type: String(form.get("type") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      description: String(form.get("description") ?? ""),
      ownershipType: String(form.get("ownershipType") ?? ""),
      numberOfUnits: totalUnits,
      unitMix,
      status: "active",
    });
  }

  return (
    <Card className="mt-8 border-emerald-100 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="font-semibold text-slate-950">Create property</h2>
          <p className="mt-1 text-sm text-slate-500">
            Properties stay internal until CasaX completes setup and publishes
            verified vacancies.
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <Field label="Property Name" name="name" required />
        <Field label="Property Type" name="type" required />
        <Field label="Street Address" name="address" required />
        <Field label="City" name="city" required />
        <Field label="State" name="state" required />
        <label className="text-sm font-medium text-slate-700">
          Landlord
          <select className={inputClass} name="landlordId" required>
            <option value="">Select landlord</option>
            {landlords.map((landlord) => (
              <option key={landlord.id} value={landlord.id}>
                {landlord.user.profile
                  ? `${landlord.user.profile.firstName} ${landlord.user.profile.lastName}`
                  : landlord.user.email}
              </option>
            ))}
          </select>
        </label>
        <Field label="Ownership Type" name="ownershipType" />
        <label className="md:col-span-2 text-sm font-medium text-slate-700">
          Description
          <textarea className={inputClass} name="description" rows={3} />
        </label>
        <div className="md:col-span-2 rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-950">Unit mix</h3>
              <p className="mt-1 text-sm text-slate-500">
                CasaX will generate unit placeholders from this mix immediately.
              </p>
            </div>
            <Button onClick={addUnitMixRow} type="button" variant="outline">
              <Plus className="mr-2 size-4" />
              Add row
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {unitMixRows.map((row) => (
              <div
                className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:grid-cols-[1fr_0.6fr_0.9fr_0.7fr_auto]"
                key={row.id}
              >
                <UnitMixField
                  label="Unit Type"
                  onChange={(value) =>
                    updateUnitMixRow(row.id, "unitType", value)
                  }
                  placeholder="Mini flat"
                  value={row.unitType}
                />
                <UnitMixField
                  label="Quantity"
                  onChange={(value) =>
                    updateUnitMixRow(row.id, "quantity", value)
                  }
                  type="number"
                  value={row.quantity}
                />
                <UnitMixField
                  label="Annual Rent"
                  onChange={(value) =>
                    updateUnitMixRow(row.id, "annualRent", value)
                  }
                  type="number"
                  value={row.annualRent}
                />
                <UnitMixField
                  label="Prefix"
                  onChange={(value) => updateUnitMixRow(row.id, "prefix", value)}
                  placeholder="MF"
                  value={row.prefix}
                />
                <Button
                  className="self-end px-3 py-2 text-xs"
                  disabled={unitMixRows.length === 1}
                  onClick={() => removeUnitMixRow(row.id)}
                  type="button"
                  variant="ghost"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Total Units
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {totalUnits}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Annual Rent Roll
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCurrency(annualRentRoll)}
              </p>
            </div>
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button disabled={create.isPending} type="submit">
            {create.isPending ? "Creating..." : "Create property and units"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PropertySetupTable({ rows }: { rows: AdminPropertyReview[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.5fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
        <span>Property Name</span>
        <span>Landlord</span>
        <span>Location</span>
        <span>Units</span>
        <span>Status</span>
        <span>Created Date</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((property) => (
          <PropertySetupRow key={property.id} property={property} />
        ))}
      </div>
    </Card>
  );
}

function PropertySetupRow({ property }: { property: AdminPropertyReview }) {
  const landlordName = property.landlord.user.profile
    ? `${property.landlord.user.profile.firstName} ${property.landlord.user.profile.lastName}`
    : property.landlord.user.email;

  return (
    <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_1fr_1fr_0.5fr_0.8fr_0.8fr_0.8fr] lg:items-center">
      <div>
        <Link
          className="font-semibold text-slate-950 transition hover:text-emerald-700"
          href={`/property-setup/${property.id}`}
        >
          {property.name}
        </Link>
        <p className="mt-1 text-sm text-slate-500">{property.type}</p>
      </div>
      <Metric label="Landlord" value={landlordName} />
      <Metric label="Location" value={`${property.city}, ${property.state}`} />
      <Metric label="Units" value={String(property._count.units)} />
      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {statusLabels[property.listingStatus]}
      </span>
      <Metric
        label="Created"
        value={new Date(property.createdAt).toLocaleDateString()}
      />
      <div className="flex flex-wrap gap-2">
        <Button asChild className="px-3 py-2 text-xs" variant="outline">
          <Link href={`/property-setup/${property.id}`}>
            Open <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

interface UnitMixFormRow {
  id: number;
  unitType: string;
  quantity: number;
  annualRent: number;
  prefix: string;
}

function UnitMixField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className={inputClass}
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={label !== "Prefix"}
        type={type}
        value={value}
      />
    </label>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input className={inputClass} name={name} required={required} type={type} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400 lg:hidden">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700 lg:mt-0">{value}</p>
    </div>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
