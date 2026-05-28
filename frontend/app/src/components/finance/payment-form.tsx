"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { RentPaymentInput } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { paymentSchema } from "@/features/finance/schemas";
import { useTenancies } from "@/features/tenancies/queries";

type PaymentValues = z.infer<typeof paymentSchema>;

export function PaymentForm({
  tenancyId,
  isPending,
  error,
  onSubmit,
}: {
  tenancyId?: string;
  isPending: boolean;
  error?: string;
  onSubmit: (values: RentPaymentInput) => Promise<void>;
}) {
  const tenancies = useTenancies("active");
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      tenancyId: tenancyId ?? "",
      amount: 0,
      dueDate: "",
      paidAt: "",
      status: "pending",
      method: "bank_transfer",
      reference: "",
      notes: "",
      proofUrl: "",
      collectedByCaretakerId: "",
    },
  });

  return (
    <Card>
      <form
        className="grid gap-5 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await onSubmit({
              ...values,
              paidAt: values.paidAt || undefined,
              reference: values.reference || undefined,
              notes: values.notes || undefined,
              proofUrl: values.proofUrl || undefined,
              collectedByCaretakerId:
                values.collectedByCaretakerId || undefined,
            });
          } catch {
            // Mutation error is rendered below.
          }
        })}
      >
        <div className="md:col-span-2">
          <Field label="Tenancy" error={form.formState.errors.tenancyId?.message}>
            <select className={inputClass} {...form.register("tenancyId")}>
              <option value="">Select tenancy</option>
              {tenancies.data?.items.map((tenancy) => (
                <option key={tenancy.id} value={tenancy.id}>
                  {tenancy.property.name} / {tenancy.unit.name} /{" "}
                  {formatCurrency(tenancy.rentAmount)}
                </option>
              ))}
            </select>
          </Field>
          {tenancies.isError ? (
            <p className="mt-2 text-xs text-orange-700">
              Active tenancies could not be loaded.
            </p>
          ) : null}
        </div>
        <Field label="Amount received (NGN)" error={form.formState.errors.amount?.message}>
          <input
            className={inputClass}
            min="0.01"
            step="0.01"
            type="number"
            {...form.register("amount", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Due date" error={form.formState.errors.dueDate?.message}>
          <input className={inputClass} type="date" {...form.register("dueDate")} />
        </Field>
        <Field label="Payment status" error={form.formState.errors.status?.message}>
          <select className={inputClass} {...form.register("status")}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
          </select>
        </Field>
        <Field label="Collection method" error={form.formState.errors.method?.message}>
          <select className={inputClass} {...form.register("method")}>
            <option value="bank_transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="pos">POS</option>
            <option value="card">Card</option>
            <option value="online_gateway">Online gateway</option>
          </select>
        </Field>
        <Field label="Paid at" error={form.formState.errors.paidAt?.message}>
          <input
            className={inputClass}
            type="datetime-local"
            {...form.register("paidAt")}
          />
        </Field>
        <Field label="Reference" error={form.formState.errors.reference?.message}>
          <input
            className={inputClass}
            placeholder="Transfer or receipt reference"
            {...form.register("reference")}
          />
        </Field>
        <Field
          label="Collector ID (optional)"
          error={form.formState.errors.collectedByCaretakerId?.message}
        >
          <input
            className={inputClass}
            placeholder="Caretaker UUID when collected on behalf"
            {...form.register("collectedByCaretakerId")}
          />
        </Field>
        <Field label="Proof URL" error={form.formState.errors.proofUrl?.message}>
          <input
            className={inputClass}
            placeholder="Secure receipt or transfer evidence URL"
            {...form.register("proofUrl")}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Notes" error={form.formState.errors.notes?.message}>
            <textarea
              className={`${inputClass} min-h-24 resize-none`}
              placeholder="Manual record context or reconciliation notes."
              {...form.register("notes")}
            />
          </Field>
        </div>
        {error ? (
          <p className="text-sm text-orange-700 md:col-span-2">{error}</p>
        ) : null}
        <div className="md:col-span-2">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving record..." : "Create payment record"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

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
