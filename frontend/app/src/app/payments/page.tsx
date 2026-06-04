"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CreditCard,
  Download,
  ReceiptText,
} from "lucide-react";
import type { PaymentStatus } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import {
  useInitializePayment,
  useLandlordRemittances,
  useMyRentRenewal,
  usePaymentSummary,
  usePayments,
} from "@/features/finance/queries";
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
  const [propertyId, setPropertyId] = useState("");
  const summary = usePaymentSummary();
  const remittances = useLandlordRemittances();

  const payments = usePayments({
    status,
    dueBefore: dueBefore || undefined,
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
  const remittedThisMonth =
    remittances.data?.items
      .filter((item) => item.status === "paid" && isThisMonth(item.updatedAt))
      .reduce((total, item) => total + item.netAmount, 0) ?? 0;

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Rent & payouts"
        title="Rent & payouts"
        description="Track rent collected through CasaX, pending collections, receipts, and landlord payout status."
        action={
          <Button asChild variant="outline">
            <Link href="/remittances">View payout statements</Link>
          </Button>
        }
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <FinanceMetric
          label="Expected Rent"
          value={formatCurrency(summary.data?.totalExpectedRent ?? 0)}
        />
        <FinanceMetric
          label="Collected Rent"
          value={formatCurrency(summary.data?.totalReceived ?? 0)}
        />
        <FinanceMetric
          label="Outstanding Rent"
          value={formatCurrency(summary.data?.totalOverdue ?? 0)}
        />
        <FinanceMetric
          label="Pending Remittance"
          value={formatCurrency(summary.data?.totalPendingRemittance ?? 0)}
        />
        <FinanceMetric
          label="Remitted This Month"
          value={formatCurrency(remittedThisMonth)}
        />
      </section>

      <Card className="mt-8 grid gap-4 md:grid-cols-3">
        <Filter label="Status">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as PaymentStatus | "")
            }
          >
            <option value="">All statuses</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Filter>

        <Filter label="Property">
          <select
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
          >
            <option value="">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </Filter>

        <Filter label="Due before">
          <input
            type="date"
            value={dueBefore}
            onChange={(event) => setDueBefore(event.target.value)}
          />
        </Filter>

      </Card>

      <Card className="mt-6">
        <p className="text-sm font-medium text-emerald-700">
          Landlord payout timeline
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {["Collected", "Processing", "Pending Remittance", "Remitted"].map(
            (step, index) => (
              <div
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                key={step}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-emerald-700 shadow-sm">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  {step}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  CasaX keeps collection and remittance stages visible.
                </p>
              </div>
            ),
          )}
        </div>
      </Card>

      <section className="mt-6">
        {payments.isLoading ? <LoadingCards /> : null}

        {payments.isError ? (
          <ErrorState
            title="Unable to load payments"
            onRetry={() => void payments.refetch()}
          />
        ) : null}

        {payments.data?.items.length === 0 ? (
          <Card className="py-14 text-center">
            <CreditCard className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No payment records found</h2>
            <p className="mt-2 text-sm text-slate-500">
              CasaX rent collection records will appear here once payments are
              received.
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
                      Due {formatDate(payment.dueDate)} /{" "}
                      {payment.collectedByCaretaker
                        ? "CasaX field collection"
                        : "CasaX rent receipt"}
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

function FinanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </Card>
  );
}

function isThisMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function TenantPaymentsPage() {
  const router = useRouter();
  const overview = useMyRentRenewal();
  const initialize = useInitializePayment();
  const [devPayment, setDevPayment] = useState<{
    reference: string;
    message?: string;
  } | null>(null);

  const nextPayment = overview.data?.rentPayments
    .filter((payment) =>
      ["pending", "overdue", "processing"].includes(payment.status),
    )
    .sort(
      (left, right) =>
        new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
    )[0];

  const payablePayment =
    nextPayment && ["pending", "overdue"].includes(nextPayment.status)
      ? nextPayment
      : undefined;
  const nextRenewal = overview.data?.renewalPayments
    .filter((payment) =>
      ["pending", "overdue", "processing"].includes(payment.status),
    )
    .sort(
      (left, right) =>
        new Date(left.renewalStartDate).getTime() -
        new Date(right.renewalStartDate).getTime(),
    )[0];
  const payableRenewal =
    nextRenewal && ["pending", "overdue"].includes(nextRenewal.status)
      ? nextRenewal
      : undefined;
  const hasRentDue = Boolean(
    payablePayment && Number(payablePayment.amount) > 0,
  );
  const hasRenewalDue = Boolean(
    payableRenewal && Number(payableRenewal.amount) > 0,
  );
  const activeTenancy = overview.data?.rentPayments[0]?.tenancy;
  const totalPaid =
    overview.data?.rentPayments
      ?.filter((payment) => payment.status === "paid")
      .reduce((sum, payment) => sum + payment.amount, 0) ?? 0;

  async function handlePayRent() {
    if (!payablePayment) return;
    const result = await initialize.mutateAsync(payablePayment.id);
    if (result.authorizationUrl) {
      router.push(result.authorizationUrl);
      return;
    }
    setDevPayment({
      reference: result.paymentReference,
      message: result.message,
    });
  }

  async function handlePayRenewal() {
    if (!payableRenewal) return;
    const result = await initialize.mutateAsync(payableRenewal.id);
    if (result.authorizationUrl) {
      router.push(result.authorizationUrl);
      return;
    }
    setDevPayment({
      reference: result.paymentReference,
      message: result.message,
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">
          Rent & Renewal
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Rent & Renewal
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track your rent, renewal payments, receipts and payment status.
            </p>
          </div>

          {hasRentDue ? (
            <Button
              className="w-full sm:w-auto"
              disabled={initialize.isPending}
              onClick={() => void handlePayRent()}
            >
              {initialize.isPending ? "Preparing payment..." : "Pay rent"}
            </Button>
          ) : (
            <Button asChild className="w-full sm:w-auto" variant="ghost">
              <Link href="#payment-history">View payment history</Link>
            </Button>
          )}
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="bg-slate-950 p-6 text-white">
          <p className="text-sm text-emerald-300">Outstanding balance</p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            {overview.data?.outstandingBalance
              ? formatCurrency(overview.data.outstandingBalance)
              : "No rent due"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {hasRentDue && payablePayment
              ? `Due ${formatDate(payablePayment.dueDate)}`
              : "You are all caught up for now."}
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-300">Payment status</span>

              {nextPayment ? (
                <StatusBadge status={nextPayment.status} />
              ) : (
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-200">
                  No rent due
                </span>
              )}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  hasRentDue && payablePayment?.status === "overdue"
                    ? "w-full bg-orange-400"
                    : hasRentDue
                      ? "w-2/3 bg-emerald-400"
                      : "w-full bg-emerald-400"
                }`}
              />
            </div>
          </div>

          {hasRentDue ? (
            <Button
              className="mt-7 w-full bg-white text-slate-950 hover:bg-slate-100"
              disabled={initialize.isPending}
              onClick={() => void handlePayRent()}
            >
              {initialize.isPending ? "Preparing payment..." : "Pay rent"}
            </Button>
          ) : (
            <Button
              asChild
              className="mt-7 w-full bg-white text-slate-950 hover:bg-slate-100"
            >
              <Link href="#payment-history">View payment history</Link>
            </Button>
          )}
        </Card>

        <Card id="payment-history">
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

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <TenantPaymentStat
              label="Rent amount"
              value={
                activeTenancy ? formatCurrency(activeTenancy.rentAmount) : "--"
              }
            />
            <TenantPaymentStat
              label="Due date"
              value={payablePayment ? formatDate(payablePayment.dueDate) : "--"}
            />
            <TenantPaymentStat label="Paid to date" value={formatCurrency(totalPaid)} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Renewal status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {payableRenewal
                      ? `Due ${formatDate(payableRenewal.renewalStartDate)}`
                      : "No renewal due"}
                  </p>
                </div>
                {nextRenewal ? (
                  <StatusBadge status={nextRenewal.status} />
                ) : null}
              </div>
              {hasRenewalDue ? (
                <Button
                  className="mt-4 w-full"
                  disabled={initialize.isPending}
                  onClick={() => void handlePayRenewal()}
                  variant="ghost"
                >
                  {initialize.isPending ? "Preparing payment..." : "Pay renewal"}
                </Button>
              ) : null}
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-500">Receipts</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {overview.data?.receipts.length ?? 0} issued
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Receipt records appear after successful payments.
              </p>
            </div>
          </div>

          {devPayment ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Development payment initialized</p>
              <p className="mt-2 leading-6">
                {devPayment.message ??
                  "Paystack is not configured, so no money was processed."}
              </p>
              <p className="mt-3 break-all rounded-xl bg-white px-3 py-2 font-mono text-xs text-emerald-800">
                {devPayment.reference}
              </p>
            </div>
          ) : null}

          {overview.isLoading ? <LoadingCards /> : null}

          {overview.isError ? (
            <ErrorState
              title="Unable to load rent records"
              onRetry={() => void overview.refetch()}
            />
          ) : null}

          {overview.data?.rentPayments.length === 0 &&
          overview.data.renewalPayments.length === 0 ? (
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

          {overview.data?.rentPayments.length ? (
            <div className="mt-6 divide-y divide-slate-100">
              {overview.data.rentPayments.map((payment) => (
                <Link
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  href={`/payments/${payment.id}`}
                  key={payment.id}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      {payment.status === "paid" ? (
                        <Download className="size-4" />
                      ) : (
                        <ReceiptText className="size-4" />
                      )}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-950">
                        {formatCurrency(payment.amount)}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        Due {formatDate(payment.dueDate)}
                      </span>
                    </span>
                  </span>

                  <StatusBadge status={payment.status} />
                </Link>
              ))}
            </div>
          ) : null}

          {overview.data?.renewalPayments.length ? (
            <div className="mt-6 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4">
              {overview.data.renewalPayments.map((payment) => (
                <div
                  className="flex items-center justify-between gap-4 py-4 first:pt-4 last:pb-4"
                  key={payment.id}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-950">
                      Renewal / {formatCurrency(payment.amount)}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      Period starts {formatDate(payment.renewalStartDate)}
                    </span>
                  </span>
                  <StatusBadge status={payment.status} />
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </section>
    </main>
  );
}

function TenantPaymentStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
      {label}
      <div className="[&_input]:h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:text-sm [&_input]:font-medium [&_input]:text-slate-700 [&_select]:h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:font-medium [&_select]:text-slate-700">
        {children}
      </div>
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
