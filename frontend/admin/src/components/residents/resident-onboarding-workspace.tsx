"use client";

import { FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, UserRound } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  getAdminApplications,
  getAdminAvailableResidentUnits,
  getAdminResidentOnboardingSummary,
  onboardApprovedApplicant,
  onboardExistingResident,
  type AdminApplicationRecord,
  type AdminAvailableResidentUnit,
} from "@/services/operations";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const paymentFrequencyLabels = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Biannual",
  yearly: "Yearly",
} as const;

export function ResidentOnboardingWorkspace({
  showHeader = true,
}: {
  showHeader?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"approved" | "manual">("approved");
  const applications = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: getAdminApplications,
  });
  const summary = useQuery({
    queryKey: ["admin", "resident-onboarding-summary"],
    queryFn: getAdminResidentOnboardingSummary,
  });
  const availableUnits = useQuery({
    queryKey: ["admin", "resident-available-units"],
    queryFn: getAdminAvailableResidentUnits,
  });

  return (
    <>
      {showHeader ? (
        <PageHeader
          eyebrow="CasaX Operations"
          title="Resident Onboarding"
          description="Convert approved applicants or record existing residents using rent inherited from the assigned unit."
        />
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          isLoading={summary.isLoading}
          label="Approved Applicants Awaiting Onboarding"
          value={summary.data?.approvedApplicantsAwaitingOnboarding ?? 0}
        />
        <MetricCard
          isLoading={summary.isLoading}
          label="Available Units"
          value={summary.data?.availableUnits ?? 0}
        />
        <MetricCard
          isLoading={summary.isLoading}
          label="Active Residents"
          value={summary.data?.activeResidents ?? 0}
        />
        <MetricCard
          isLoading={summary.isLoading}
          label="Expiring Leases"
          value={summary.data?.expiringLeases ?? 0}
        />
      </div>

      <div className="mt-8 flex w-fit rounded-2xl bg-slate-100 p-1">
        <TabButton
          active={activeTab === "approved"}
          label="Approved Applicants"
          onClick={() => setActiveTab("approved")}
        />
        <TabButton
          active={activeTab === "manual"}
          label="Add Existing Resident"
          onClick={() => setActiveTab("manual")}
        />
      </div>

      {activeTab === "approved" ? (
        <ApprovedApplicantsPanel
          applications={applications.data ?? []}
          isError={applications.isError}
          isLoading={applications.isLoading}
          onRetry={() => void applications.refetch()}
        />
      ) : (
        <ManualResidentPanel
          availableUnits={availableUnits.data ?? []}
          isError={availableUnits.isError}
          isLoading={availableUnits.isLoading}
          onRetry={() => {
            void availableUnits.refetch();
          }}
        />
      )}
    </>
  );
}

function ApprovedApplicantsPanel({
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
  const approved = applications.filter((application) => application.status === "approved");

  return (
    <section className="mt-7">
      {isLoading ? <LoadingCards /> : null}
      {isError ? (
        <ErrorState title="Unable to load approved applicants" onRetry={onRetry} />
      ) : null}
      {!isLoading && !isError && approved.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50">
            <UserRound className="size-6 text-emerald-700" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-950">
            No approved applicants awaiting onboarding.
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Approved applications will appear here for CasaX resident conversion.
          </p>
        </Card>
      ) : null}
      {approved.length ? (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_1.1fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
            <span>Applicant</span>
            <span>Property</span>
            <span>Unit</span>
            <span>Annual Rent</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          <div className="divide-y divide-slate-100">
            {approved.map((application) => (
              <ApprovedApplicantRow
                application={application}
                key={application.id}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function ApprovedApplicantRow({
  application,
}: {
  application: AdminApplicationRecord;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>();
  const mutation = useMutation({
    mutationFn: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      return onboardApprovedApplicant(application.id, {
        moveInDate: String(form.get("moveInDate") ?? ""),
        leaseStartDate: String(form.get("leaseStartDate") ?? ""),
        leaseEndDate: String(form.get("leaseEndDate") ?? ""),
        paymentFrequency: String(form.get("paymentFrequency") ?? "yearly") as
          | "monthly"
          | "quarterly"
          | "biannual"
          | "yearly",
        sendInvite: form.get("sendInvite") === "on",
      });
    },
    onSuccess: async () => {
      setMessage("Resident onboarding completed from approved application.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard-summary"],
      });
    },
  });
  const applicantName = application.applicant.user.profile
    ? `${application.applicant.user.profile.firstName} ${application.applicant.user.profile.lastName}`
    : application.applicant.user.email;

  return (
    <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_1.1fr] lg:items-start">
      <Metric label="Applicant" value={applicantName} />
      <Metric label="Property" value={application.property.name} />
      <Metric label="Unit" value={application.unit.name} />
      <Metric
        label="Annual Rent"
        value={formatCurrency(application.unit.rentAmount)}
      />
      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Approved
      </span>
      <form className="grid gap-3" onSubmit={(event) => mutation.mutate(event)}>
        <Field label="Move-in date" name="moveInDate" required type="date" />
        <Field label="Lease start date" name="leaseStartDate" required type="date" />
        <Field label="Lease end date" name="leaseEndDate" required type="date" />
        <FrequencyField />
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input className="size-4 rounded border-slate-300" defaultChecked name="sendInvite" type="checkbox" />
          Send resident invite
        </label>
        {mutation.isError ? (
          <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Unable to onboard resident."}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}
        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Onboarding..." : "Convert to resident"}
        </Button>
      </form>
    </div>
  );
}

function ManualResidentPanel({
  availableUnits,
  isLoading,
  isError,
  onRetry,
}: {
  availableUnits: AdminAvailableResidentUnit[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const [selectedLandlordId, setSelectedLandlordId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [paymentFrequency, setPaymentFrequency] =
    useState<keyof typeof paymentFrequencyLabels>("yearly");
  const [message, setMessage] = useState<string>();
  const landlords = uniqueLandlords(availableUnits);
  const filteredProperties = uniqueProperties(
    availableUnits.filter((unit) =>
      selectedLandlordId ? unit.landlordId === selectedLandlordId : true,
    ),
  );
  const unitsForProperty = availableUnits.filter(
    (unit) => unit.propertyId === selectedPropertyId,
  );
  const selectedUnit = availableUnits.find((unit) => unit.id === selectedUnitId);
  const annualRent = Number(selectedUnit?.annualRent ?? 0);
  const serviceCharge = Number(selectedUnit?.serviceCharge ?? 0);
  const payable = payableForFrequency(annualRent, paymentFrequency);

  const mutation = useMutation({
    mutationFn: onboardExistingResident,
    onSuccess: async (result) => {
      formRef.current?.reset();
      setSelectedLandlordId("");
      setSelectedPropertyId("");
      setSelectedUnitId("");
      setPaymentFrequency("yearly");
      setMessage("Resident onboarded successfully from unit rent.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "resident-available-units"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "resident-onboarding-summary"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard-summary"],
      });
      return result;
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(undefined);
    mutation.mutate({
      unitId: selectedUnitId,
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      moveInDate: String(form.get("moveInDate") ?? ""),
      leaseStartDate: String(form.get("leaseStartDate") ?? ""),
      leaseEndDate: String(form.get("leaseEndDate") ?? ""),
      paymentFrequency,
      sendInvite: form.get("sendInvite") === "on",
    });
  }

  if (isLoading) return <div className="mt-7"><LoadingCards /></div>;
  if (isError) {
    return (
      <div className="mt-7">
        <ErrorState title="Unable to load onboarding data" onRetry={onRetry} />
      </div>
    );
  }

  return (
    <Card className="mt-7 border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-5 text-emerald-700" />
        <div>
          <h2 className="font-semibold text-slate-950">
            Add Existing Resident Manually
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a vacant unit. CasaX inherits rent from the unit and creates
            the tenancy schedule from that rent.
          </p>
        </div>
      </div>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit} ref={formRef}>
        <label className="text-sm font-medium text-slate-700">
          Landlord
          <select
            className={inputClass}
            onChange={(event) => {
              setSelectedLandlordId(event.target.value);
              setSelectedPropertyId("");
              setSelectedUnitId("");
            }}
            required
            value={selectedLandlordId}
          >
            <option value="">Select landlord</option>
            {landlords.map(({ id, landlord }) => (
              <option key={id} value={id}>
                {landlord.user.profile
                  ? `${landlord.user.profile.firstName} ${landlord.user.profile.lastName}`
                  : landlord.user.email}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Property
          <select
            className={inputClass}
            disabled={!selectedLandlordId}
            onChange={(event) => {
              setSelectedPropertyId(event.target.value);
              setSelectedUnitId("");
            }}
            required
            value={selectedPropertyId}
          >
            <option value="">Select property</option>
            {filteredProperties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name} / {property.city}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Available unit
          <select
            className={inputClass}
            disabled={!selectedPropertyId}
            onChange={(event) => setSelectedUnitId(event.target.value)}
            required
            value={selectedUnitId}
          >
            <option value="">Select available unit</option>
            {unitsForProperty.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} / {unit.unitType} / {formatCurrency(unit.annualRent)}
              </option>
            ))}
          </select>
        </label>

        <Field label="Resident first name" name="firstName" required />
        <Field label="Resident last name" name="lastName" required />
        <Field label="Email" name="email" type="email" />
        <Field label="Phone" name="phone" />
        <Field label="Move-in date" name="moveInDate" required type="date" />
        <Field label="Lease start date" name="leaseStartDate" required type="date" />
        <Field label="Lease end date" name="leaseEndDate" required type="date" />
        <FrequencyField
          onChange={(value) => setPaymentFrequency(value)}
          value={paymentFrequency}
        />

        <UnitRentSummary
          annualRent={annualRent}
          payable={payable}
          paymentFrequency={paymentFrequency}
          serviceCharge={serviceCharge}
          unit={selectedUnit}
        />

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 md:col-span-2">
          <input className="size-4 rounded border-slate-300" defaultChecked name="sendInvite" type="checkbox" />
          Send invite
        </label>
        {mutation.isError ? (
          <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700 md:col-span-2">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Unable to onboard resident."}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2">
            {message}
          </p>
        ) : null}
        <div className="md:col-span-2 flex justify-end">
          <Button disabled={mutation.isPending || !selectedUnitId} type="submit">
            {mutation.isPending ? "Onboarding..." : "Create Resident & Tenancy"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function UnitRentSummary({
  unit,
  annualRent,
  payable,
  paymentFrequency,
  serviceCharge,
}: {
  unit?: AdminAvailableResidentUnit;
  annualRent: number;
  payable: number;
  serviceCharge: number;
  paymentFrequency: keyof typeof paymentFrequencyLabels;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 md:col-span-2">
      <p className="text-sm font-semibold text-slate-950">Unit rent summary</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SmallStat label="Selected unit" value={unit ? unit.name : "-"} />
        <SmallStat label="Annual rent" value={formatCurrency(annualRent)} />
        <SmallStat label="Service charge" value={formatCurrency(serviceCharge)} />
        <SmallStat
          label={`${paymentFrequencyLabels[paymentFrequency]} payable`}
          value={formatCurrency(payable + serviceCharge)}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Rent is inherited from the unit record and cannot be edited during
        resident onboarding.
      </p>
    </div>
  );
}

function MetricCard({
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

function uniqueLandlords(units: AdminAvailableResidentUnit[]) {
  const map = new Map<string, AdminAvailableResidentUnit["landlord"]>();
  units.forEach((unit) => map.set(unit.landlordId, unit.landlord));
  return Array.from(map.entries()).map(([id, landlord]) => ({ id, landlord }));
}

function uniqueProperties(units: AdminAvailableResidentUnit[]) {
  const map = new Map<string, AdminAvailableResidentUnit["property"]>();
  units.forEach((unit) => map.set(unit.propertyId, unit.property));
  return Array.from(map.values());
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
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

function FrequencyField({
  value,
  onChange,
}: {
  value?: keyof typeof paymentFrequencyLabels;
  onChange?: (value: keyof typeof paymentFrequencyLabels) => void;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      Payment frequency
      <select
        className={inputClass}
        defaultValue={value ?? "yearly"}
        name="paymentFrequency"
        onChange={(event) =>
          onChange?.(event.target.value as keyof typeof paymentFrequencyLabels)
        }
        value={value}
      >
        {Object.entries(paymentFrequencyLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function payableForFrequency(
  annualRent: number,
  frequency: keyof typeof paymentFrequencyLabels,
) {
  const divisors = {
    yearly: 1,
    biannual: 2,
    quarterly: 4,
    monthly: 12,
  } as const;
  return annualRent / divisors[frequency];
}
