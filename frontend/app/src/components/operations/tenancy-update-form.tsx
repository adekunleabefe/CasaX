"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Tenancy, TenancyUpdateInput } from "@casax/types";
import { Button } from "@casax/ui";
import { tenancyUpdateSchema } from "@/features/tenancies/schemas";

type UpdateValues = z.infer<typeof tenancyUpdateSchema>;

export function TenancyUpdateForm({
  tenancy,
  isPending,
  error,
  onCancel,
  onSubmit,
}: {
  tenancy: Tenancy;
  isPending: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (input: TenancyUpdateInput) => Promise<void>;
}) {
  const form = useForm<UpdateValues>({
    resolver: zodResolver(tenancyUpdateSchema),
    defaultValues: {
      endDate: tenancy.endDate.slice(0, 10),
      rentAmount: tenancy.rentAmount,
      paymentFrequency: tenancy.paymentFrequency,
      notes: tenancy.notes ?? "",
    },
  });

  return (
    <form
      className="mt-6 grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
          onCancel();
        } catch {
          // Mutation error is rendered below.
        }
      })}
    >
      <label className={labelClass}>
        Lease end date
        <input
          className={inputClass}
          type="date"
          {...form.register("endDate")}
        />
      </label>
      <label className={labelClass}>
        Rent amount (NGN)
        <input
          className={inputClass}
          min="0"
          type="number"
          {...form.register("rentAmount", { valueAsNumber: true })}
        />
      </label>
      <label className={labelClass}>
        Frequency
        <select className={inputClass} {...form.register("paymentFrequency")}>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="biannual">Biannual</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Notes
        <textarea
          className={`${inputClass} min-h-24 resize-none`}
          {...form.register("notes")}
        />
      </label>
      {error ? (
        <p className="text-sm text-orange-700 sm:col-span-2">{error}</p>
      ) : null}
      <div className="flex gap-3 sm:col-span-2">
        <Button disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Save tenancy"}
        </Button>
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
}

const labelClass = "block text-sm font-medium text-slate-700";
const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
