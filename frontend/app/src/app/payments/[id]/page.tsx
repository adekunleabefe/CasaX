"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CalendarRange, ExternalLink, Home, ReceiptText, UserRound } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { PaymentEditForm } from "@/components/finance/payment-edit-form";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useDeletePayment, usePayment, useUpdatePayment } from "@/features/finance/queries";
import { useCurrentUser } from "@/features/auth/queries";

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const payment = usePayment(id);
  const update = useUpdatePayment(id);
  const remove = useDeletePayment();
  const currentUser = useCurrentUser();
  const [editing, setEditing] = useState(false);

  if (payment.isLoading) return <main className="p-5 lg:p-8"><LoadingCards /></main>;
  if (payment.isError || !payment.data) {
    return <main className="p-5 lg:p-8"><ErrorState title="Unable to load payment" onRetry={() => void payment.refetch()} /></main>;
  }
  const record = payment.data;
  const payer = record.payer.profile;
  const canManage = currentUser.data?.role === "landlord";
  const isTenant = currentUser.data?.role === "tenant";

  if (isTenant) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <p className="text-sm font-medium text-emerald-700">Rent receipt</p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(record.amount)}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {record.property.name} / {record.unit.name}
              </p>
            </div>
            <StatusBadge status={record.status} />
          </div>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <div className="grid gap-6 sm:grid-cols-2">
              <Info
                icon={CalendarRange}
                label="Due date"
                value={new Date(record.dueDate).toLocaleDateString()}
              />
              <Info
                icon={ReceiptText}
                label="Payment method"
                value={record.method.replaceAll("_", " ")}
              />
              <Info
                icon={Home}
                label="Home"
                value={`${record.unit.unitType} / ${record.unit.name}`}
              />
              <Info
                icon={UserRound}
                label="Payer"
                value={
                  payer
                    ? `${payer.firstName} ${payer.lastName}`
                    : record.payer.email
                }
              />
            </div>
            {record.notes ? (
              <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                {record.notes}
              </p>
            ) : null}
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-950">Documents</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Downloadable invoices and receipts will be available here.
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Reference
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {record.reference ?? "No reference supplied"}
            </p>
            {record.proofUrl ? (
              <a
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
                href={record.proofUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open receipt <ExternalLink className="size-4" />
              </a>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Receipt document is not attached yet.
              </p>
            )}
            <Button className="mt-6 w-full">Download receipt</Button>
          </Card>
        </div>

        <Link
          className="mt-6 inline-flex text-sm font-medium text-emerald-700"
          href="/payments"
        >
          Back to rent payments
        </Link>
      </main>
    );
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Payment record"
        title={formatCurrency(record.amount)}
        description={`${record.property.name} / ${record.unit.name}`}
        backHref="/payments"
        action={<StatusBadge status={record.status} />}
      />
      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Info icon={UserRound} label="Payer" value={payer ? `${payer.firstName} ${payer.lastName}` : record.payer.email} />
            <Info icon={Home} label="Unit" value={`${record.unit.unitType} / ${record.unit.name}`} />
            <Info icon={CalendarRange} label="Due date" value={new Date(record.dueDate).toLocaleDateString()} />
            <Info icon={ReceiptText} label="Collection method" value={record.method.replaceAll("_", " ")} />
          </div>
          <div className="mt-7 rounded-xl bg-slate-50 p-5 text-sm">
            <p className="font-medium">
              {record.collectedByCaretaker ? "Collected by caretaker" : "Received directly by landlord"}
            </p>
            <p className="mt-2 text-slate-500">
              {record.collectedByCaretaker?.user.email ??
                "Direct receipts are considered remitted immediately."}
            </p>
          </div>
          {record.notes ? <p className="mt-5 text-sm text-slate-600">{record.notes}</p> : null}
        </Card>
        <Card>
          <h2 className="font-semibold">Reconciliation</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            References and proof keep manual payment records reviewable.
          </p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Reference</p>
          <p className="mt-2 text-sm">{record.reference ?? "No reference supplied"}</p>
          {record.proofUrl ? (
            <a className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-700" href={record.proofUrl} rel="noreferrer" target="_blank">
              Open proof <ExternalLink className="size-4" />
            </a>
          ) : (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No proof document attached.</p>
          )}
          {canManage ? (
            <Button
              className="mt-6 w-full"
              onClick={() => setEditing((value) => !value)}
              variant="outline"
            >
              {editing ? "Close editing" : "Edit record"}
            </Button>
          ) : null}
          {canManage && record.status !== "paid" && record.status !== "cancelled" ? (
            <Button className="mt-3 w-full" disabled={update.isPending} onClick={() => void update.mutateAsync({ status: "paid" })}>
              Mark as paid
            </Button>
          ) : null}
          {canManage && record.status !== "cancelled" ? (
            <Button
              className="mt-3 w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              disabled={remove.isPending}
              onClick={() => void remove.mutateAsync(id)}
              variant="outline"
            >
              Cancel record
            </Button>
          ) : null}
          {(update.error || remove.error) ? <p className="mt-4 text-sm text-orange-700">{(update.error ?? remove.error)?.message}</p> : null}
        </Card>
      </div>
      {editing && canManage ? (
        <Card className="mt-6">
          <h2 className="font-semibold">Edit payment record</h2>
          <p className="mt-2 text-sm text-slate-500">
            Correct manual details before the receipt is allocated to a remittance.
          </p>
          <PaymentEditForm
            error={update.error?.message}
            isPending={update.isPending}
            onCancel={() => setEditing(false)}
            onSubmit={(input) => update.mutateAsync(input).then(() => undefined)}
            payment={record}
          />
        </Card>
      ) : null}
      <Link className="mt-6 inline-flex text-sm font-medium text-emerald-700" href={`/tenancies/${record.tenancyId}`}>
        Open linked tenancy
      </Link>
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 text-emerald-600" />
      <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-sm font-medium capitalize">{value}</p></div>
    </div>
  );
}
