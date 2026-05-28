"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CreditCard, Download, Plus, ReceiptText } from "lucide-react";
import type { PaymentStatus } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { usePayments } from "@/features/finance/queries";
import { useCurrentUser } from "@/features/auth/queries";

export default function PaymentsPage() {
  const currentUser = useCurrentUser();
  if (currentUser.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }
  if (currentUser.data?.role === "tenant") {
    return <TenantPaymentsPage />;
  }
  return <OperationalPaymentsPage />;
}

function OperationalPaymentsPage() {
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [dueBefore, setDueBefore] = useState("");
  const [caretakerOnly, setCaretakerOnly] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const payments = usePayments({
    status,
    dueBefore: dueBefore || undefined,
    caretakerCollected: caretakerOnly ? true : undefined,
    propertyId: propertyId || undefined,
  });
  const properties = useMemo(
    () =>
      Array.from(
        new Map(
          payments.data?.items.map((payment) => [
            payment.propertyId,
            payment.property,
          ]) ?? [],
        ).values(),
      ),
    [payments.data?.items],
  );

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Payments received"
        title="Rent payment records"
        description="Trace money received against the tenancy, unit and collector responsible for it."
        action={
          <Button asChild>
            <Link href="/payments/new">
              <Plus className="mr-2 size-4" /> Record payment
            </Link>
          </Button>
        }
      />
      <Card className="mt-8 grid gap-4 md:grid-cols-4">
        <Filter label="Status">
          <select value={status} onChange={(event) => setStatus(event.target.value as PaymentStatus | "")}>
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Filter>
        <Filter label="Property">
          <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
            <option value="">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </Filter>
        <Filter label="Due before">
          <input type="date" value={dueBefore} onChange={(event) => setDueBefore(event.target.value)} />
        </Filter>
        <label className="flex items-end gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            checked={caretakerOnly}
            className="mb-0.5 accent-emerald-600"
            onChange={(event) => setCaretakerOnly(event.target.checked)}
            type="checkbox"
          />
          Caretaker collected only
        </label>
      </Card>
      <section className="mt-6">
        {payments.isLoading ? <LoadingCards /> : null}
        {payments.isError ? (
          <ErrorState title="Unable to load payments" onRetry={() => void payments.refetch()} />
        ) : null}
        {payments.data?.items.length === 0 ? (
          <Card className="py-14 text-center">
            <CreditCard className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No payment records found</h2>
            <p className="mt-2 text-sm text-slate-500">
              Record received rent to establish an accountable collection trail.
            </p>
          </Card>
        ) : null}
        {payments.data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {payments.data.items.map((payment) => (
              <Card key={payment.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {payment.property.name} / {payment.unit.name}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Due {new Date(payment.dueDate).toLocaleDateString()} /{" "}
                      {payment.collectedByCaretaker
                        ? "Caretaker collected"
                        : "Direct to landlord"}
                    </p>
                  </div>
                  <StatusBadge status={payment.status} />
                </div>
                <Link
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
                  href={`/payments/${payment.id}`}
                >
                  Open payment <ArrowRight className="size-4" />
                </Link>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function TenantPaymentsPage() {
  const payments = usePayments({});
  const nextPayment = payments.data?.items
    .filter((payment) => ["pending", "overdue"].includes(payment.status))
    .sort(
      (left, right) =>
        new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
    )[0];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Rent payments</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Rent payments
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track your rent payments, invoices and receipts.
            </p>
          </div>
          <Button className="w-full sm:w-auto">Pay rent</Button>
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="bg-slate-950 p-6 text-white">
          <p className="text-sm text-emerald-300">Upcoming invoice</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            {nextPayment ? formatCurrency(nextPayment.amount) : "No rent due"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {nextPayment
              ? `Due ${formatDate(nextPayment.dueDate)}`
              : "Your invoices and receipts will appear when rent is issued."}
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${
                nextPayment?.status === "overdue"
                  ? "w-full bg-orange-400"
                  : nextPayment
                    ? "w-2/3 bg-emerald-400"
                    : "w-full bg-emerald-400"
              }`}
            />
          </div>
          <Button className="mt-7 w-full bg-white text-slate-950 hover:bg-slate-100">
            Pay rent
          </Button>
        </Card>

        <Card>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Payment history
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Invoices and receipts
              </h2>
            </div>
          </div>
          {payments.isLoading ? <LoadingCards /> : null}
          {payments.isError ? (
            <ErrorState
              title="Unable to load rent records"
              onRetry={() => void payments.refetch()}
            />
          ) : null}
          {payments.data?.items.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-10 text-center">
              <ReceiptText className="mx-auto size-8 text-slate-400" />
              <h3 className="mt-4 font-semibold text-slate-950">
                No rent records yet.
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Your invoices and receipts will appear here.
              </p>
            </div>
          ) : null}
          {payments.data?.items.length ? (
            <div className="mt-6 divide-y divide-slate-100">
              {payments.data.items.map((payment) => (
                <Link
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  href={`/payments/${payment.id}`}
                  key={payment.id}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-950">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Invoice due {formatDate(payment.dueDate)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={payment.status} />
                    <Download className="size-4 text-slate-300" />
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </Card>
      </section>
    </main>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 [&_input]:mt-2 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_select]:mt-2 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm">
      {label}
      {children}
    </label>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
