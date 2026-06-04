"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DoorOpen, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { applicationFormSchema } from "@/features/operations/schemas";
import { useAvailableApplicationUnits } from "@/features/operations/queries";

type ApplicationValues = z.infer<typeof applicationFormSchema>;

export function ApplicationForm({
  isPending,
  error,
  onSubmit,
}: {
  isPending: boolean;
  error?: string;
  onSubmit: (values: ApplicationValues) => Promise<void>;
}) {
  const properties = useAvailableApplicationUnits();
  const [unitSearch, setUnitSearch] = useState("");
  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      propertyId: "",
      unitId: "",
      applicant: { firstName: "", lastName: "", email: "", phone: "" },
      notes: "",
    },
  });
  const propertyId = useWatch({ control: form.control, name: "propertyId" });
  const property = properties.data?.find((item) => item.id === propertyId);
  const availableUnits =
    property?.units.filter(
      (unit) =>
        unit.status === "vacant" &&
        `${unit.name} ${unit.unitType}`
          .toLowerCase()
          .includes(unitSearch.toLowerCase()),
    ) ?? [];

  async function submit(values: ApplicationValues) {
    try {
      await onSubmit(values);
    } catch {
      // API error is displayed at the foot of the form.
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
      <Card>
        <h2 className="font-semibold">Applicant information</h2>
        <p className="mt-1 text-sm text-slate-500">
          Capture the applicant details CasaX needs for review and inspection
          coordination.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="First name"
            error={form.formState.errors.applicant?.firstName?.message}
          >
            <input
              className={inputClass}
              {...form.register("applicant.firstName")}
            />
          </Field>
          <Field
            label="Last name"
            error={form.formState.errors.applicant?.lastName?.message}
          >
            <input
              className={inputClass}
              {...form.register("applicant.lastName")}
            />
          </Field>
          <Field
            label="Email"
            error={form.formState.errors.applicant?.email?.message}
          >
            <input
              className={inputClass}
              type="email"
              {...form.register("applicant.email")}
            />
          </Field>
          <Field
            label="Phone"
            error={form.formState.errors.applicant?.phone?.message}
          >
            <input
              className={inputClass}
              {...form.register("applicant.phone")}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Select a vacant unit</h2>
        <p className="mt-1 text-sm text-slate-500">
          Only vacant units can enter the CasaX applicant review workflow.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Property"
            error={form.formState.errors.propertyId?.message}
          >
            <select
              className={inputClass}
              {...form.register("propertyId", {
                onChange: () => form.setValue("unitId", ""),
              })}
            >
              <option value="">Select property</option>
              {properties.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} / {item.city}
                </option>
              ))}
            </select>
          </Field>
          <label className="block text-sm font-medium text-slate-700">
            Search units
            <span className="relative mt-2 block">
              <Search className="absolute left-4 top-3.5 size-4 text-slate-400" />
              <input
                className={`${inputClass} mt-0 pl-11`}
                onChange={(event) => setUnitSearch(event.target.value)}
                placeholder="Unit name or type"
                value={unitSearch}
              />
            </span>
          </label>
        </div>
        {properties.isLoading ? (
          <div className="mt-5 h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : null}
        {properties.isError ? (
          <div className="mt-5 rounded-xl bg-orange-50 px-4 py-4 text-sm text-orange-700">
            Vacant units could not be loaded. Refresh the page to retry.
          </div>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {availableUnits.map((unit) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition has-checked:border-emerald-500 has-checked:bg-emerald-50/40"
              key={unit.id}
            >
              <input
                className="mt-1 accent-emerald-600"
                type="radio"
                value={unit.id}
                {...form.register("unitId")}
              />
              <DoorOpen className="mt-0.5 size-4 text-slate-500" />
              <span className="text-sm">
                <span className="block font-medium">{unit.name}</span>
                <span className="mt-1 block text-slate-500">
                  {unit.unitType} / {formatCurrency(unit.rentAmount)} yearly
                </span>
              </span>
            </label>
          ))}
        </div>
        {propertyId && !properties.isLoading && availableUnits.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No vacant units match this selection.
          </p>
        ) : null}
        {form.formState.errors.unitId ? (
          <p className="mt-3 text-xs font-medium text-orange-700">
            {form.formState.errors.unitId.message}
          </p>
        ) : null}
      </Card>

      <Card>
        <Field
          label="Operational notes"
          error={form.formState.errors.notes?.message}
        >
          <textarea
            className={`${inputClass} min-h-28 resize-none`}
            placeholder="Inspection context, documents received, or follow-up needed."
            {...form.register("notes")}
          />
        </Field>
        {error ? <p className="mt-4 text-sm text-orange-700">{error}</p> : null}
        <Button
          className="mt-6 w-full sm:w-auto"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Submitting..." : "Submit application"}
        </Button>
      </Card>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? (
        <span className="mt-2 block text-xs font-medium text-orange-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
