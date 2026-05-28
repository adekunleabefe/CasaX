"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { TenantOnboardingInput } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { tenantOnboardingSchema } from "@/features/onboarding/schemas";

type Values = z.infer<typeof tenantOnboardingSchema>;

export function TenantOnboardingForm({
  rentAmount,
  mode,
  isPending,
  error,
  onSubmit,
}: {
  rentAmount: number;
  mode: "direct" | "request";
  isPending: boolean;
  error?: string;
  onSubmit: (input: TenantOnboardingInput) => Promise<void>;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(tenantOnboardingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      startDate: "",
      endDate: "",
      rentAmount,
      paymentFrequency: "yearly",
      notes: "",
    },
  });
  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit({
            ...values,
            email: values.email || undefined,
            phone: values.phone || undefined,
            notes: values.notes || undefined,
          });
        } catch {
          // Request failures render below.
        }
      })}
    >
      <Card>
        <h2 className="font-semibold">Tenant details</h2>
        <p className="mt-1 text-sm text-slate-500">
          Identify the occupant who will be attached to this tenancy.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="First name" error={form.formState.errors.firstName?.message}>
            <input className={inputClass} {...form.register("firstName")} />
          </Field>
          <Field label="Last name" error={form.formState.errors.lastName?.message}>
            <input className={inputClass} {...form.register("lastName")} />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <input className={inputClass} type="email" {...form.register("email")} />
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}>
            <input className={inputClass} {...form.register("phone")} />
          </Field>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Tenancy terms</h2>
        <p className="mt-1 text-sm text-slate-500">
          A draft agreement is created automatically with the tenancy.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Start date" error={form.formState.errors.startDate?.message}>
            <input className={inputClass} type="date" {...form.register("startDate")} />
          </Field>
          <Field label="End date" error={form.formState.errors.endDate?.message}>
            <input className={inputClass} type="date" {...form.register("endDate")} />
          </Field>
          <Field label="Rent amount (NGN)" error={form.formState.errors.rentAmount?.message}>
            <input className={inputClass} min="0" type="number" {...form.register("rentAmount")} />
          </Field>
          <Field
            label="Payment frequency"
            error={form.formState.errors.paymentFrequency?.message}
          >
            <select className={inputClass} {...form.register("paymentFrequency")}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="biannual">Biannual</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Notes" error={form.formState.errors.notes?.message}>
            <textarea
              className={`${inputClass} min-h-28 resize-none`}
              placeholder="Lease context or onboarding details."
              {...form.register("notes")}
            />
          </Field>
        </div>
        {error ? <p className="mt-5 text-sm text-orange-700">{error}</p> : null}
        <Button className="mt-6 w-full sm:w-auto" disabled={isPending} type="submit">
          {isPending
            ? "Submitting..."
            : mode === "direct"
              ? "Create tenancy"
              : "Submit for approval"}
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
