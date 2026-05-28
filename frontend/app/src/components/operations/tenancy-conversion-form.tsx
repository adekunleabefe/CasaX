"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@casax/ui";
import { tenancyConversionSchema } from "@/features/tenancies/schemas";

type ConversionValues = z.infer<typeof tenancyConversionSchema>;

export function TenancyConversionForm({
  rentAmount,
  isPending,
  error,
  onCancel,
  onSubmit,
}: {
  rentAmount: number;
  isPending: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: ConversionValues) => Promise<void>;
}) {
  const form = useForm<ConversionValues>({
    resolver: zodResolver(tenancyConversionSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      rentAmount,
      paymentFrequency: "yearly",
      notes: "",
    },
  });
  const input =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch {
          // Mutation failure is displayed below.
        }
      })}
    >
      <Field
        label="Lease start date"
        error={form.formState.errors.startDate?.message}
      >
        <input className={input} type="date" {...form.register("startDate")} />
      </Field>
      <Field
        label="Lease end date"
        error={form.formState.errors.endDate?.message}
      >
        <input className={input} type="date" {...form.register("endDate")} />
      </Field>
      <Field
        label="Rent amount (NGN)"
        error={form.formState.errors.rentAmount?.message}
      >
        <input
          className={input}
          min="0"
          type="number"
          {...form.register("rentAmount")}
        />
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
        <Field label="Notes" error={form.formState.errors.notes?.message}>
          <textarea
            className={`${input} min-h-24 resize-none`}
            placeholder="Payment confirmation or lease context."
            {...form.register("notes")}
          />
        </Field>
      </div>
      {error ? (
        <p className="text-sm text-orange-700 sm:col-span-2">{error}</p>
      ) : null}
      <div className="flex gap-3 sm:col-span-2">
        <Button disabled={isPending} type="submit">
          {isPending ? "Creating tenancy..." : "Confirm tenancy"}
        </Button>
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
      </div>
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
        <span className="mt-2 block text-xs text-orange-700">{error}</span>
      ) : null}
    </label>
  );
}
