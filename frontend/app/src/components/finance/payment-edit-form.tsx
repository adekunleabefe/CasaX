"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { RentPayment, RentPaymentInput } from "@casax/types";
import { Button } from "@casax/ui";
import { paymentEditSchema } from "@/features/finance/schemas";

type EditValues = z.infer<typeof paymentEditSchema>;

export function PaymentEditForm({
  payment,
  isPending,
  error,
  onCancel,
  onSubmit,
}: {
  payment: RentPayment;
  isPending: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (input: Partial<RentPaymentInput>) => Promise<void>;
}) {
  const form = useForm<EditValues>({
    resolver: zodResolver(paymentEditSchema),
    defaultValues: {
      amount: payment.amount,
      dueDate: payment.dueDate.slice(0, 10),
      status: payment.status,
      method: payment.method,
      reference: payment.reference ?? "",
      notes: payment.notes ?? "",
      proofUrl: payment.proofUrl ?? "",
    },
  });

  return (
    <form
      className="mt-6 space-y-4 border-t border-slate-100 pt-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit({
            ...values,
            reference: values.reference || undefined,
            notes: values.notes || undefined,
            proofUrl: values.proofUrl || undefined,
          });
          onCancel();
        } catch {
          // Mutation error is rendered below.
        }
      })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Amount
          <input
            className={inputClass}
            min="0.01"
            step="0.01"
            type="number"
            {...form.register("amount", { valueAsNumber: true })}
          />
        </label>
        <label className={labelClass}>
          Due date
          <input className={inputClass} type="date" {...form.register("dueDate")} />
        </label>
        <label className={labelClass}>
          Status
          <select className={inputClass} {...form.register("status")}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className={labelClass}>
          Method
          <select className={inputClass} {...form.register("method")}>
            <option value="bank_transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="pos">POS</option>
            <option value="card">Card</option>
            <option value="online_gateway">Online gateway</option>
          </select>
        </label>
      </div>
      <label className={labelClass}>
        Reference
        <input className={inputClass} {...form.register("reference")} />
      </label>
      <label className={labelClass}>
        Proof URL
        <input className={inputClass} {...form.register("proofUrl")} />
      </label>
      <label className={labelClass}>
        Notes
        <textarea className={`${inputClass} min-h-20 resize-none`} {...form.register("notes")} />
      </label>
      {error ? <p className="text-sm text-orange-700">{error}</p> : null}
      <div className="flex gap-3">
        <Button disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Save changes"}
        </Button>
        <Button onClick={onCancel} type="button" variant="outline">
          Close
        </Button>
      </div>
    </form>
  );
}

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-slate-500";
const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
