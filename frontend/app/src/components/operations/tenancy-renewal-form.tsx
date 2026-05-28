"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Tenancy, TenancyInput } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { tenancyConversionSchema } from "@/features/tenancies/schemas";

type Values = z.infer<typeof tenancyConversionSchema>;

export function TenancyRenewalForm({
  tenancy,
  isPending,
  error,
  onSubmit,
}: {
  tenancy: Tenancy;
  isPending: boolean;
  error?: string;
  onSubmit: (values: TenancyInput) => Promise<void>;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(tenancyConversionSchema),
    defaultValues: {
      startDate: tenancy.endDate.slice(0, 10),
      endDate: "",
      rentAmount: tenancy.rentAmount,
      paymentFrequency: tenancy.paymentFrequency,
      notes: "",
    },
  });
  const input =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <Card>
      <form
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await onSubmit(values);
          } catch {
            // Mutation errors are displayed below.
          }
        })}
      >
        <Field label="New start date" error={form.formState.errors.startDate?.message}>
          <input className={input} type="date" {...form.register("startDate")} />
        </Field>
        <Field label="New end date" error={form.formState.errors.endDate?.message}>
          <input className={input} type="date" {...form.register("endDate")} />
        </Field>
        <Field label="Rent amount (NGN)" error={form.formState.errors.rentAmount?.message}>
          <input className={input} min="0" type="number" {...form.register("rentAmount")} />
        </Field>
        <Field
          label="Payment frequency"
          error={form.formState.errors.paymentFrequency?.message}
        >
          <select className={input} {...form.register("paymentFrequency")}>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="biannual">Biannual</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Renewal notes" error={form.formState.errors.notes?.message}>
            <textarea
              className={`${input} min-h-28 resize-none`}
              placeholder="Renewal context or revised lease terms."
              {...form.register("notes")}
            />
          </Field>
        </div>
        {error ? (
          <p className="text-sm text-orange-700 sm:col-span-2">{error}</p>
        ) : null}
        <Button className="sm:col-span-2 sm:w-fit" disabled={isPending} type="submit">
          {isPending ? "Renewing tenancy..." : "Create renewal tenancy"}
        </Button>
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
