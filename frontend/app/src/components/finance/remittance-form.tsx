"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { RemittanceInput } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { useEligiblePayments } from "@/features/finance/queries";
import { remittanceSchema } from "@/features/finance/schemas";

type RemittanceValues = z.infer<typeof remittanceSchema>;

export function RemittanceForm({
  isPending,
  error,
  onSubmit,
}: {
  isPending: boolean;
  error?: string;
  onSubmit: (input: RemittanceInput) => Promise<void>;
}) {
  const eligible = useEligiblePayments();
  const form = useForm<RemittanceValues>({
    resolver: zodResolver(remittanceSchema),
    defaultValues: {
      propertyId: "",
      caretakerId: "",
      paymentIds: [],
      amount: 0,
      status: "remitted",
      method: "bank_transfer",
      remittedAt: "",
      reference: "",
      notes: "",
      proofUrl: "",
    },
  });
  const selectedIds =
    useWatch({ control: form.control, name: "paymentIds" }) ?? [];
  const firstSelected = eligible.data?.find((payment) =>
    selectedIds.includes(payment.id),
  );
  const availableTotal = (eligible.data ?? [])
    .filter((payment) => selectedIds.includes(payment.id))
    .reduce((total, payment) => total + payment.unremittedAmount, 0);

  function togglePayment(paymentId: string) {
    const payment = eligible.data?.find((item) => item.id === paymentId);
    if (!payment?.collectedByCaretakerId) return;
    const selected = form.getValues("paymentIds");
    const removing = selected.includes(paymentId);
    const next = removing
      ? selected.filter((id) => id !== paymentId)
      : [...selected, paymentId];
    if (
      !removing &&
      firstSelected &&
      (firstSelected.propertyId !== payment.propertyId ||
        firstSelected.collectedByCaretakerId !==
          payment.collectedByCaretakerId)
    ) {
      form.setError("paymentIds", {
        message: "Select payments from one property and one caretaker.",
      });
      return;
    }
    form.clearErrors("paymentIds");
    form.setValue("paymentIds", next, { shouldValidate: true });
    const anchor =
      (removing && firstSelected?.id === paymentId
        ? eligible.data?.find((item) => next.includes(item.id))
        : payment) ?? null;
    form.setValue("propertyId", anchor?.propertyId ?? "", {
      shouldValidate: true,
    });
    form.setValue("caretakerId", anchor?.collectedByCaretakerId ?? "", {
      shouldValidate: true,
    });
  }

  return (
    <form
      className="grid gap-5 xl:grid-cols-[1fr_390px]"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit({
            ...values,
            remittedAt: values.remittedAt || undefined,
            reference: values.reference || undefined,
            notes: values.notes || undefined,
            proofUrl: values.proofUrl || undefined,
          });
        } catch {
          // Mutation error is rendered below.
        }
      })}
    >
      <Card>
        <h2 className="text-lg font-semibold">Eligible collections</h2>
        <p className="mt-2 text-sm text-slate-500">
          Select paid records collected by the same caretaker for one property.
        </p>
        <div className="mt-6 space-y-3">
          {eligible.isLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ) : null}
          {eligible.isError ? (
            <p className="text-sm text-orange-700">
              Eligible payment records could not be loaded.
            </p>
          ) : null}
          {eligible.data?.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No unremitted caretaker collections are available.
            </p>
          ) : null}
          {eligible.data?.map((payment) => {
            const disabled =
              Boolean(firstSelected) &&
              !selectedIds.includes(payment.id) &&
              (firstSelected?.propertyId !== payment.propertyId ||
                firstSelected?.collectedByCaretakerId !==
                  payment.collectedByCaretakerId);
            return (
              <label
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  selectedIds.includes(payment.id)
                    ? "border-emerald-300 bg-emerald-50/60"
                    : "border-slate-200 bg-white"
                } ${disabled ? "opacity-45" : ""}`}
                key={payment.id}
              >
                <input
                  checked={selectedIds.includes(payment.id)}
                  className="mt-1 accent-emerald-600"
                  disabled={disabled}
                  onChange={() => togglePayment(payment.id)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {payment.property.name} / {payment.unit.name}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Available to remit: {formatCurrency(payment.unremittedAmount)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {form.formState.errors.paymentIds ? (
          <p className="mt-3 text-xs text-orange-700">
            {form.formState.errors.paymentIds.message}
          </p>
        ) : null}
      </Card>
      <Card className="h-fit">
        <h2 className="text-lg font-semibold">Transfer record</h2>
        <p className="mt-2 text-sm text-slate-500">
          Available selected amount: {formatCurrency(availableTotal)}
        </p>
        <div className="mt-6 space-y-4">
          <Field label="Amount remitted" error={form.formState.errors.amount?.message}>
            <input
              className={inputClass}
              max={availableTotal || undefined}
              min="0.01"
              step="0.01"
              type="number"
              {...form.register("amount", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Transfer status" error={form.formState.errors.status?.message}>
            <select className={inputClass} {...form.register("status")}>
              <option value="remitted">Remitted</option>
              <option value="partially_remitted">Partially remitted</option>
              <option value="pending">Pending</option>
              <option value="disputed">Disputed</option>
            </select>
          </Field>
          <Field label="Method" error={form.formState.errors.method?.message}>
            <select className={inputClass} {...form.register("method")}>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
              <option value="card">Card</option>
              <option value="online_gateway">Online gateway</option>
            </select>
          </Field>
          <Field label="Remitted at" error={form.formState.errors.remittedAt?.message}>
            <input
              className={inputClass}
              type="datetime-local"
              {...form.register("remittedAt")}
            />
          </Field>
          <Field label="Reference" error={form.formState.errors.reference?.message}>
            <input className={inputClass} {...form.register("reference")} />
          </Field>
          <Field label="Proof URL" error={form.formState.errors.proofUrl?.message}>
            <input className={inputClass} {...form.register("proofUrl")} />
          </Field>
          <Field label="Notes" error={form.formState.errors.notes?.message}>
            <textarea
              className={`${inputClass} min-h-20 resize-none`}
              {...form.register("notes")}
            />
          </Field>
        </div>
        {error ? <p className="mt-4 text-sm text-orange-700">{error}</p> : null}
        <Button className="mt-6 w-full" disabled={isPending} type="submit">
          {isPending ? "Saving remittance..." : "Create remittance"}
        </Button>
      </Card>
    </form>
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
