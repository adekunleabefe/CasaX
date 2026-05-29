"use client";

import Link from "next/link";
import { CalendarDays, CreditCard, ReceiptText } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { StatusBadge } from "@/components/operations/status-badge";
import { useTenancyPayments } from "@/features/finance/queries";
import { useTenancies } from "@/features/tenancies/queries";
import { rentAmountLabel } from "@/lib/rent-label";

export default function RentPage() {
  const tenancies = useTenancies("");
  const activeTenancy = tenancies.data?.items.find(
    (tenancy) => tenancy.status === "active" || tenancy.status === "pending",
  );

  const payments = useTenancyPayments(activeTenancy?.id ?? "");

  const nextPayment = payments.data
    ?.filter((payment) => ["pending", "overdue"].includes(payment.status))
    .sort(
      (left, right) =>
        new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
    )[0];

  const hasRentDue = Boolean(nextPayment && Number(nextPayment.amount) > 0);

  const paymentHref =
    hasRentDue && nextPayment ? `/payments/${nextPayment.id}` : "/payments";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Rent</p>

        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Rent overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              See what is due, what is paid and what is coming next.
            </p>
          </div>

          <Button asChild className="w-full sm:w-auto">
            <Link href={paymentHref}>
              {hasRentDue ? "Pay rent" : "View payment history"}
            </Link>
          </Button>
        </div>
      </header>

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-sm text-emerald-300">Amount due</p>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            {hasRentDue && nextPayment
              ? formatCurrency(nextPayment.amount)
              : "No rent due"}
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {hasRentDue && nextPayment
              ? `Due ${formatDate(nextPayment.dueDate)}`
              : "You are all caught up for now."}
          </p>

          <div className="mt-7 rounded-2xl bg-white/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-300">Payment status</span>

              {hasRentDue && nextPayment ? (
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
                  hasRentDue && nextPayment?.status === "overdue"
                    ? "w-full bg-orange-400"
                    : hasRentDue
                      ? "w-2/3 bg-emerald-400"
                      : "w-full bg-emerald-400"
                }`}
              />
            </div>
          </div>

          <Button
            asChild
            className="mt-7 w-full bg-white text-slate-950 hover:bg-slate-100"
          >
            <Link href={paymentHref}>
              {hasRentDue ? "Pay rent" : "View payment history"}
            </Link>
          </Button>
        </Card>

        <div className="space-y-5">
          <Card>
            <CreditCard className="size-5 text-emerald-700" />

            <h2 className="mt-4 font-semibold text-slate-950">
              {activeTenancy
                ? rentAmountLabel(activeTenancy.paymentFrequency)
                : "Rent amount"}
            </h2>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {activeTenancy ? formatCurrency(activeTenancy.rentAmount) : "--"}
            </p>

            <p className="mt-2 text-sm capitalize text-slate-500">
              {activeTenancy?.paymentFrequency ?? "No active rent schedule"}
            </p>
          </Card>

          <Card>
            <CalendarDays className="size-5 text-emerald-700" />

            <h2 className="mt-4 font-semibold text-slate-950">
              Lease status
            </h2>

            <div className="mt-4">
              {activeTenancy ? (
                <StatusBadge status={activeTenancy.status} />
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  No active lease
                </span>
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Lease ends</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {activeTenancy ? formatDate(activeTenancy.endDate) : "--"}
              </p>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Stay period</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {activeTenancy
                  ? `${formatDate(activeTenancy.startDate)} - ${formatDate(
                      activeTenancy.endDate,
                    )}`
                  : "--"}
              </p>
            </div>
          </Card>
        </div>
      </section>

      <Card className="mt-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Upcoming invoice
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Invoice preview
            </h2>
          </div>

          <Button asChild variant="ghost">
            <Link href="/payments">View payments</Link>
          </Button>
        </div>

        {hasRentDue && nextPayment ? (
          <Link
            className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/30"
            href={`/payments/${nextPayment.id}`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ReceiptText className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-medium text-slate-950">
                  {formatCurrency(nextPayment.amount)}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Due {formatDate(nextPayment.dueDate)}
                </span>
              </span>
            </span>

            <CalendarDays className="size-4 text-slate-300" />
          </Link>
        ) : (
          <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
            No rent due. Your next invoice will appear here when issued.
          </p>
        )}
      </Card>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}