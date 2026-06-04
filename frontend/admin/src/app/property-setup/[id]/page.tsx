"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  Home,
  ImageIcon,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  approvePropertyReview,
  createAdminPropertyDocument,
  createAdminPropertyPhoto,
  createAdminUnit,
  deleteAdminUnit,
  getAdminProperty,
  markAdminUnitReady,
  prepareAdminVacancy,
  submitAdminPropertyForReview,
  updateAdminProperty,
  type AdminPropertyReview,
  type AdminUnit,
} from "@/services/operations";

type PropertyTab = "overview" | "units" | "residents" | "documents" | "activity";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const tabs: { key: PropertyTab; label: string; icon: typeof Building2 }[] = [
  { key: "overview", label: "Overview", icon: Building2 },
  { key: "units", label: "Units", icon: Home },
  { key: "residents", label: "Residents", icon: Users },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "activity", label: "Activity", icon: Activity },
];

export default function AdminPropertySetupDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<PropertyTab>("overview");
  const property = useQuery({
    queryKey: ["admin", "property", params.id],
    queryFn: () => getAdminProperty(params.id),
  });

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Property Setup"
        title={property.data?.name ?? "Property setup"}
        description="Complete the CasaX-created property record, verify generated units, and prepare vacancies for publishing."
        backHref="/property-setup"
      />
      {property.isLoading ? <LoadingCards /> : null}
      {property.isError ? (
        <ErrorState
          title="Unable to load property setup"
          onRetry={() => void property.refetch()}
        />
      ) : null}
      {property.data ? (
        <SetupWorkspace
          activeTab={activeTab}
          onTabChange={setActiveTab}
          property={property.data}
        />
      ) : null}
    </main>
  );
}

function SetupWorkspace({
  activeTab,
  onTabChange,
  property,
}: {
  activeTab: PropertyTab;
  onTabChange: (tab: PropertyTab) => void;
  property: AdminPropertyReview;
}) {
  return (
    <div className="mt-8 space-y-6">
      <TabNav activeTab={activeTab} onTabChange={onTabChange} />
      {activeTab === "overview" ? <OverviewTab property={property} /> : null}
      {activeTab === "units" ? <UnitsTab property={property} /> : null}
      {activeTab === "residents" ? <ResidentsTab property={property} /> : null}
      {activeTab === "documents" ? <DocumentsTab property={property} /> : null}
      {activeTab === "activity" ? <ActivityTab property={property} /> : null}
    </div>
  );
}

function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: PropertyTab;
  onTabChange: (tab: PropertyTab) => void;
}) {
  return (
    <Card className="border-slate-200 p-2 shadow-sm">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              type="button"
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function OverviewTab({ property }: { property: AdminPropertyReview }) {
  const stats = propertyStats(property);
  const landlordName = personName(property.landlord.user.profile) ?? property.landlord.user.email;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <PropertyInformation property={property} />
        <Card className="border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-950">Portfolio snapshot</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryBlock label="Total units" value={String(property.units.length)} />
            <SummaryBlock label="Occupied" value={String(stats.occupiedUnits)} />
            <SummaryBlock label="Vacant" value={String(stats.vacantUnits)} />
            <SummaryBlock label="Annual rent roll" value={formatCurrency(stats.annualRentRoll)} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailBlock label="Landlord" value={landlordName} />
            <DetailBlock label="Setup status" value={property.listingStatus.replaceAll("_", " ")} />
            <DetailBlock label="Property type" value={property.type} />
            <DetailBlock
              label="Address"
              value={`${property.address}, ${property.city}, ${property.state}`}
            />
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <WorkflowCard property={property} />
        <Card className="border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-950">Quick actions</h2>
          <div className="mt-4 space-y-3">
            <Button asChild className="w-full" variant="outline">
              <Link href="#add-unit">Add unit</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/residents/onboard?propertyId=${property.id}`}>
                Onboard resident
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/vacancy-publishing?tab=drafts">Prepare vacancy</Link>
            </Button>
            <Button asChild className="w-full" variant="ghost">
              <a href={`mailto:${property.landlord.user.email}`}>
                Send landlord update
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PropertyInformation({ property }: { property: AdminPropertyReview }) {
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: (input: Partial<AdminPropertyReview>) =>
      updateAdminProperty(property.id, {
        name: input.name,
        type: input.type,
        address: input.address,
        city: input.city,
        state: input.state,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "property", property.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      name: String(form.get("name") ?? ""),
      type: String(form.get("type") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
    } as Partial<AdminPropertyReview>);
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <Building2 className="size-5 text-emerald-700" />
        <h2 className="font-semibold text-slate-950">Property information</h2>
      </div>
      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <Field label="Property name" name="name" defaultValue={property.name} />
        <Field label="Property type" name="type" defaultValue={property.type} />
        <Field label="Street address" name="address" defaultValue={property.address} />
        <Field label="City" name="city" defaultValue={property.city} />
        <Field label="State" name="state" defaultValue={property.state} />
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Landlord
          </p>
          <p className="mt-2 font-medium text-slate-800">
            {personName(property.landlord.user.profile) ?? property.landlord.user.email}
          </p>
        </div>
        <div className="flex justify-end md:col-span-2">
          <Button disabled={update.isPending} type="submit">
            {update.isPending ? "Saving..." : "Edit property"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function UnitsTab({ property }: { property: AdminPropertyReview }) {
  const groupedUnits = useMemo(
    () =>
      property.units.reduce<Record<string, AdminUnit[]>>((groups, unit) => {
        groups[unit.unitType] = [...(groups[unit.unitType] ?? []), unit];
        return groups;
      }, {}),
    [property.units],
  );
  const stats = propertyStats(property);

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-semibold text-slate-950">Unit inventory</h2>
            <p className="mt-1 text-sm text-slate-500">
              Compact setup view for generated units. Open a unit to complete
              listing readiness.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="#add-unit">
                <Plus className="mr-2 size-4" />
                Add unit
              </Link>
            </Button>
            <Button disabled variant="outline">
              Bulk update rent
            </Button>
            <Button disabled variant="outline">
              Bulk mark ready
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <SummaryBlock label="Total units" value={String(property.units.length)} />
          <SummaryBlock label="Ready" value={String(stats.readyUnits)} />
          <SummaryBlock label="Incomplete" value={String(stats.incompleteUnits)} />
          <SummaryBlock label="Annual rent roll" value={formatCurrency(stats.annualRentRoll)} />
        </div>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        {property.units.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No generated units yet.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedUnits).map(([unitType, units]) => (
              <div key={unitType}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-950">{unitType}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {units.length} units
                  </span>
                </div>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
                  <div className="hidden grid-cols-[1.2fr_1fr_.7fr_.7fr_1fr_1fr_1fr_1fr_1.4fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 lg:grid">
                    <span>Unit</span>
                    <span>Type</span>
                    <span>Beds</span>
                    <span>Baths</span>
                    <span>Annual rent</span>
                    <span>Occupancy</span>
                    <span>Readiness</span>
                    <span>Listing</span>
                    <span>Actions</span>
                  </div>
                  {units.map((unit) => (
                    <UnitInventoryRow
                      key={unit.id}
                      propertyId={property.id}
                      propertyName={property.name}
                      unit={unit}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-slate-200 shadow-sm" id="add-unit">
        <h2 className="font-semibold text-slate-950">Add unit</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use this only when CasaX needs to correct setup data after generated
          units have been created.
        </p>
        <CreateUnitForm propertyId={property.id} />
      </Card>
    </div>
  );
}

function UnitInventoryRow({
  propertyId,
  propertyName,
  unit,
}: {
  propertyId: string;
  propertyName: string;
  unit: AdminUnit;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const markReady = useMutation({
    mutationFn: () => markAdminUnitReady(unit.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "vacancies", "ready-units"],
      });
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteAdminUnit(unit.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
    },
  });
  const prepareVacancy = useMutation({
    mutationFn: () =>
      prepareAdminVacancy(unit.id, {
        title: unit.listingTitle ?? `${unit.name} at ${propertyName}`,
        description:
          unit.publicDescription ??
          "CasaX-verified vacancy managed through CasaX operations.",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "vacancies"] });
      router.push("/vacancy-publishing?tab=drafts");
    },
  });
  const ready = canMarkReady(unit);
  const listing = unit.vacancyListings?.[0]?.status ?? "Not listed";

  return (
    <div className="grid gap-3 border-t border-slate-100 px-4 py-4 text-sm lg:grid-cols-[1.2fr_1fr_.7fr_.7fr_1fr_1fr_1fr_1fr_1.4fr] lg:items-center">
      <MobileLabel label="Unit" value={unit.name} />
      <MobileLabel label="Type" value={unit.unitType} />
      <MobileLabel label="Bedrooms" value={unit.bedroomCount} />
      <MobileLabel label="Bathrooms" value={unit.bathroomCount} />
      <MobileLabel label="Annual rent" value={formatCurrency(Number(unit.rentAmount))} />
      <StatusPill value={unit.status.replaceAll("_", " ")} />
      <ReadinessBadge status={unit.readinessStatus} />
      <StatusPill value={listing.replaceAll("_", " ")} />
      <div className="flex flex-wrap gap-2">
        <Button asChild className="px-3 py-2 text-xs" variant="outline">
          <Link href={`/property-setup/${propertyId}/units/${unit.id}`}>
            View/Edit
          </Link>
        </Button>
        <Button
          className="px-3 py-2 text-xs"
          disabled={!ready || markReady.isPending || unit.readinessStatus === "READY"}
          onClick={() => markReady.mutate()}
          type="button"
          variant="outline"
        >
          {markReady.isPending ? "Marking..." : "Mark ready"}
        </Button>
        <Button
          className="px-3 py-2 text-xs"
          disabled={
            unit.readinessStatus !== "READY" ||
            unit.status !== "VACANT" ||
            prepareVacancy.isPending
          }
          onClick={() => prepareVacancy.mutate()}
          type="button"
          variant="ghost"
        >
          {prepareVacancy.isPending ? "Preparing..." : "Prepare vacancy"}
        </Button>
        <Button
          className="px-3 py-2 text-xs text-red-600"
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ResidentsTab({ property }: { property: AdminPropertyReview }) {
  const residents = property.units.flatMap((unit) =>
    (unit.tenancies ?? []).map((tenancy) => ({ unit, tenancy })),
  );

  return (
    <Card className="border-slate-200 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-slate-950">Residents</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current residents occupying units in this property.
          </p>
        </div>
        <Button asChild>
          <Link href={`/residents/onboard?propertyId=${property.id}`}>
            Onboard resident
          </Link>
        </Button>
      </div>
      {residents.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No residents are currently attached to this property.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
          <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 lg:grid">
            <span>Resident</span>
            <span>Unit</span>
            <span>Annual rent</span>
            <span>Lease start</span>
            <span>Lease end</span>
            <span>Status</span>
          </div>
          {residents.map(({ unit, tenancy }) => (
            <div
              className="grid gap-3 border-t border-slate-100 px-4 py-4 text-sm lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr]"
              key={tenancy.id}
            >
              <MobileLabel
                label="Resident"
                value={personName(tenancy.user.profile) ?? tenancy.user.email}
              />
              <MobileLabel label="Unit" value={unit.name} />
              <MobileLabel label="Annual rent" value={formatCurrency(Number(unit.rentAmount))} />
              <MobileLabel label="Lease start" value="-" />
              <MobileLabel label="Lease end" value={formatDate(tenancy.endDate)} />
              <StatusPill value={tenancy.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DocumentsTab({ property }: { property: AdminPropertyReview }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AssetsCard propertyId={property.id} type="photo" />
      <AssetsCard propertyId={property.id} type="document" />
    </div>
  );
}

function ActivityTab({ property }: { property: AdminPropertyReview }) {
  const activity = property.activity ?? [];

  return (
    <Card className="border-slate-200 shadow-sm">
      <h2 className="font-semibold text-slate-950">Activity</h2>
      <p className="mt-1 text-sm text-slate-500">
        Property setup and unit readiness actions appear here.
      </p>
      {activity.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No activity recorded yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {activity.map((item) => (
            <div
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
              key={item.id}
            >
              <p className="font-medium text-slate-900">
                {item.action.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CreateUnitForm({ propertyId }: { propertyId: string }) {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (input: Parameters<typeof createAdminUnit>[1]) =>
      createAdminUnit(propertyId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "property"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      name: String(form.get("name") ?? ""),
      unitType: String(form.get("unitType") ?? ""),
      bedroomCount: Number(form.get("bedroomCount") ?? 0),
      bathroomCount: Number(form.get("bathroomCount") ?? 0),
      rentAmount: Number(form.get("rentAmount") ?? 0),
      serviceCharge: Number(form.get("serviceCharge") ?? 0),
      depositAmount: Number(form.get("depositAmount") ?? 0),
      readinessStatus: "INCOMPLETE",
      status: String(form.get("status") ?? "vacant") as
        | "vacant"
        | "occupied"
        | "pending_approval"
        | "maintenance"
        | "inactive",
    });
    event.currentTarget.reset();
  }

  return (
    <form className="mt-6 grid gap-3 md:grid-cols-4" onSubmit={submit}>
      <Field label="Unit number" name="name" placeholder="Unit 1" />
      <Field label="Unit type" name="unitType" placeholder="Mini-flat" />
      <Field label="Bedrooms" name="bedroomCount" type="number" />
      <Field label="Bathrooms" name="bathroomCount" type="number" />
      <Field label="Annual rent" name="rentAmount" type="number" />
      <Field label="Service charge" name="serviceCharge" type="number" />
      <Field label="Deposit amount" name="depositAmount" type="number" />
      <label className="text-sm font-medium text-slate-700">
        Unit status
        <select className={inputClass} name="status">
          <option value="vacant">Vacant</option>
          <option value="occupied">Occupied</option>
          <option value="pending_approval">Pending review</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <div className="flex justify-end md:col-span-4">
        <Button disabled={create.isPending} type="submit">
          <Plus className="mr-2 size-4" />
          {create.isPending ? "Adding..." : "Add unit"}
        </Button>
      </div>
    </form>
  );
}

function WorkflowCard({ property }: { property: AdminPropertyReview }) {
  const queryClient = useQueryClient();
  const completeSetup = useMutation({
    mutationFn: () => submitAdminPropertyForReview(property.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "property", property.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "property-reviews"],
      });
    },
  });
  const markVerified = useMutation({
    mutationFn: () =>
      approvePropertyReview(property.id, {
        note: "Property setup completed and marked verified by CasaX Operations.",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "property", property.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "property-reviews"],
      });
    },
  });

  return (
    <Card className="border-slate-200 shadow-sm">
      <h2 className="font-semibold text-slate-950">Workflow</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Complete setup internally, mark verified when the record is ready, then
        prepare vacancies for publishing.
      </p>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Current status
        </p>
        <p className="mt-2 font-semibold text-slate-800">
          {property.listingStatus.replaceAll("_", " ")}
        </p>
      </div>
      <Button
        className="mt-5 w-full"
        disabled={completeSetup.isPending || property.listingStatus !== "DRAFT"}
        onClick={() => completeSetup.mutate()}
      >
        {completeSetup.isPending ? "Completing..." : "Complete setup"}
      </Button>
      <Button
        className="mt-3 w-full"
        disabled={markVerified.isPending || property.listingStatus === "APPROVED"}
        onClick={() => markVerified.mutate()}
        variant="outline"
      >
        {markVerified.isPending ? "Marking..." : "Mark verified"}
      </Button>
    </Card>
  );
}

function AssetsCard({
  propertyId,
  type,
}: {
  propertyId: string;
  type: "photo" | "document";
}) {
  const mutation = useMutation({
    mutationFn: (input: {
      propertyId: string;
      title: string;
      url?: string;
      note?: string;
    }) =>
      type === "photo"
        ? createAdminPropertyPhoto(input.propertyId, input)
        : createAdminPropertyDocument(input.propertyId, input),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      propertyId,
      title: String(form.get("title") ?? ""),
      url: String(form.get("url") ?? ""),
      note: String(form.get("note") ?? ""),
    });
    event.currentTarget.reset();
  }

  const Icon = type === "photo" ? ImageIcon : FileText;
  return (
    <Card className="border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-emerald-700" />
        <h2 className="font-semibold capitalize text-slate-950">
          {type === "photo" ? "Photos" : "Documents"}
        </h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Upload storage is pending. These controls capture metadata only for now.
      </p>
      <form className="mt-5 space-y-3" onSubmit={submit}>
        <Field label="Title" name="title" />
        <Field label="URL or reference" name="url" />
        <Field label="Note" name="note" />
        <Button disabled={mutation.isPending} type="submit" variant="outline">
          {mutation.isPending ? "Saving..." : "Save placeholder"}
        </Button>
      </form>
    </Card>
  );
}

function ReadinessBadge({ status }: { status: AdminUnit["readinessStatus"] }) {
  const ready = status === "READY";
  const Icon = ready ? CheckCircle2 : AlertCircle;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        ready
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <Icon className="size-3.5" />
      {ready ? "Ready" : "Setup incomplete"}
    </span>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
      {value.toLowerCase()}
    </span>
  );
}

function MobileLabel({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 lg:hidden">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-800 lg:mt-0">{value}</p>
    </div>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-medium capitalize text-slate-800">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className={inputClass}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}

function propertyStats(property: AdminPropertyReview) {
  const occupiedUnits = property.units.filter((unit) => unit.status === "OCCUPIED").length;
  const vacantUnits = property.units.filter((unit) => unit.status === "VACANT").length;
  const readyUnits = property.units.filter((unit) => unit.readinessStatus === "READY").length;
  const annualRentRoll = property.units.reduce(
    (total, unit) => total + Number(unit.rentAmount),
    0,
  );
  return {
    annualRentRoll,
    occupiedUnits,
    vacantUnits,
    readyUnits,
    incompleteUnits: property.units.length - readyUnits,
  };
}

function canMarkReady(unit: AdminUnit) {
  return Boolean(
    unit.name.trim() &&
      unit.unitType.trim() &&
      Number(unit.rentAmount) > 0 &&
      unit.listingTitle?.trim() &&
      unit.publicDescription?.trim() &&
      unit.status === "VACANT",
  );
}

function personName(profile?: { firstName: string; lastName: string } | null) {
  if (!profile) return null;
  return `${profile.firstName} ${profile.lastName}`.trim();
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}
