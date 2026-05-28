"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { PropertyInput } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { propertySchema } from "@/features/properties/schemas";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export function PropertyForm({
  initialValues,
  submitLabel,
  isPending,
  error,
  onSubmit,
}: {
  initialValues?: PropertyInput;
  submitLabel: string;
  isPending: boolean;
  error?: string;
  onSubmit: (values: PropertyInput) => Promise<void>;
}) {
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof PropertyInput, string>>
  >({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = propertySchema.safeParse(values);
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
      // Mutation error is surfaced through the query state below the fields.
    }
  }

  const defaults = initialValues ?? {
    name: "",
    address: "",
    city: "",
    state: "Lagos",
    type: "Apartment building",
    status: "active",
  };

  return (
    <Card className="max-w-3xl">
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Property name" error={fieldErrors.name}>
          <input
            className={inputClass}
            defaultValue={defaults.name}
            name="name"
            placeholder="Lekki Heights"
          />
        </Field>
        <Field label="Property type" error={fieldErrors.type}>
          <input
            className={inputClass}
            defaultValue={defaults.type}
            name="type"
            placeholder="Apartment building"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Street address" error={fieldErrors.address}>
            <input
              className={inputClass}
              defaultValue={defaults.address}
              name="address"
              placeholder="14 Admiralty Way"
            />
          </Field>
        </div>
        <Field label="City" error={fieldErrors.city}>
          <input
            className={inputClass}
            defaultValue={defaults.city}
            name="city"
            placeholder="Lekki"
          />
        </Field>
        <Field label="State" error={fieldErrors.state}>
          <input
            className={inputClass}
            defaultValue={defaults.state}
            name="state"
            placeholder="Lagos"
          />
        </Field>
        <Field label="Operational status" error={fieldErrors.status}>
          <select
            className={inputClass}
            defaultValue={defaults.status}
            name="status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <div className="self-end">
          <Button className="w-full" disabled={isPending} type="submit">
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
