"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { UnitInput } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { unitSchema } from "@/features/properties/schemas";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export function UnitForm({
  initialValues,
  submitLabel,
  isPending,
  error,
  onSubmit,
}: {
  initialValues?: UnitInput;
  submitLabel: string;
  isPending: boolean;
  error?: string;
  onSubmit: (values: UnitInput) => Promise<void>;
}) {
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UnitInput, string>>
  >({});
  const defaults = initialValues ?? {
    name: "",
    rentAmount: 0,
    bedroomCount: 1,
    unitType: "Apartment",
    status: "vacant",
    isPubliclyVisible: false,
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = unitSchema.safeParse({
      ...Object.fromEntries(formData),
      isPubliclyVisible: formData.has("isPubliclyVisible"),
    });
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(errors).map(([field, messages]) => [
            field,
            messages?.[0],
          ]),
        ),
      );
      return;
    }
    setFieldErrors({});
    try {
      await onSubmit(parsed.data);
    } catch {
      // Mutation error is rendered inside this form.
    }
  }

  return (
    <Card className="max-w-3xl">
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Unit name or number" error={fieldErrors.name}>
          <input
            className={inputClass}
            defaultValue={defaults.name}
            name="name"
            placeholder="Unit A3"
          />
        </Field>
        <Field label="Unit type" error={fieldErrors.unitType}>
          <input
            className={inputClass}
            defaultValue={defaults.unitType}
            name="unitType"
            placeholder="Apartment"
          />
        </Field>
        <Field label="Annual rent (NGN)" error={fieldErrors.rentAmount}>
          <input
            className={inputClass}
            defaultValue={defaults.rentAmount || ""}
            min="0"
            name="rentAmount"
            placeholder="2400000"
            type="number"
          />
        </Field>
        <Field label="Bedrooms" error={fieldErrors.bedroomCount}>
          <input
            className={inputClass}
            defaultValue={defaults.bedroomCount}
            min="0"
            name="bedroomCount"
            type="number"
          />
        </Field>
        <Field label="Occupancy status" error={fieldErrors.status}>
          <select
            className={inputClass}
            defaultValue={defaults.status}
            name="status"
          >
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="pending_approval">Pending approval</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input
            className="size-4 accent-emerald-600"
            defaultChecked={defaults.isPubliclyVisible}
            name="isPubliclyVisible"
            type="checkbox"
          />
          Publish as a vacancy when ready
        </label>
        <div className="sm:col-span-2">
          <Button
            className="w-full sm:w-auto"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-orange-700 sm:col-span-2">{error}</p>
        ) : null}
      </form>
    </Card>
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
