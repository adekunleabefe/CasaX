"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ClipboardPlus,
  CreditCard,
  DoorOpen,
  FileText,
  HousePlus,
  LifeBuoy,
  ReceiptText,
  ShieldCheck,
  UserPlus,
  Wallet,
  KeyRound,
} from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import {
  usePaymentSummary,
  useTenancyPayments,
} from "@/features/finance/queries";
import { useApplicationsSummary } from "@/features/operations/queries";
import { useTenantOnboardingRequests } from "@/features/onboarding/queries";
import { useLandlordSummary } from "@/features/properties/queries";
import {
  useOccupancySummary,
  useTenancies,
  useTenancyAgreement,
} from "@/features/tenancies/queries";
import { useCurrentUser } from "@/features/auth/queries";
import { StatusBadge } from "@/components/operations/status-badge";
import { rentAmountLabel } from "@/lib/rent-label";

type ActivityItem = {
  id: string;
  icon: ElementType;
  title: string;
  detail: string;
  date: string;
  href: string;
  tone?: "default" | "warning" | "positive";
};

const quickActions = [
  { label: "Add property", href: "/properties/new", icon: Building2 },
  { label: "Add unit", href: "/properties", icon: HousePlus },
  {
    label: "Create application",
    href: "/applications/new",
    icon: ClipboardPlus,
  },
  { label: "Record payment", href: "/payments/new", icon: CreditCard },
];

export default function DashboardPage() {
  const currentUser = useCurrentUser();

  if (currentUser.isLoading || currentUser.isError) {
    return (
      <main className="mx-auto max-w-7xl p-5 lg:p-8">
        <div className="h-9 w-64 animate-pulse rounded bg-slate-100" />
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-slate-100" />
      </main>
    );
  }

  if (currentUser.data?.role === "tenant") {
    return <TenantWorkspace />;
  }
  if (currentUser.data?.role === "caretaker") {
    return <CaretakerDashboard />;
  }

  return <LandlordDashboard />;
}

function LandlordDashboard() {
  const summary = useLandlordSummary();
  const applications = useApplicationsSummary();
  const onboarding = useTenantOnboardingRequests();
  const occupancy = useOccupancySummary();
  const finance = usePaymentSummary();

  const activity = buildActivity(
    finance.data?.recentPayments ?? [],
    finance.data?.recentRemittances ?? [],
    occupancy.data?.recentActivity ?? [],
  );
  const pendingOnboarding =
    onboarding.data?.filter((request) => request.status === "pending").length;

  return (
    <main className="mx-auto max-w-7xl p-5 lg:p-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Portfolio overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Property operations
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            A real-time view of owned properties and unit readiness.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/properties/new">Add property</Link>
        </Button>
      </header>

      {summary.data?.totalProperties === 0 ? (
        <Card className="mt-8 flex flex-col justify-between gap-5 border-emerald-100 bg-emerald-50/40 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-950">
              Your portfolio is ready to begin
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add your first property to start tracking units and occupancy.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/properties/new">Create property</Link>
          </Button>
        </Card>
      ) : null}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Operations at a glance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The signals requiring your attention today.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PrimaryMetric
            icon={DoorOpen}
            label="Vacant units"
            loading={summary.isLoading}
            value={summary.data?.vacantUnits}
          />
          <PrimaryMetric
            icon={UserPlus}
            label="Pending tenant onboarding"
            loading={onboarding.isLoading}
            value={pendingOnboarding}
            tone="warning"
          />
          <PrimaryMetric
            icon={ClipboardPlus}
            label="Pending applications"
            loading={applications.isLoading}
            value={applications.data?.pendingApprovals}
            tone="warning"
          />
          <PrimaryMetric
            icon={Wallet}
            label="Pending remittance"
            loading={finance.isLoading}
            value={
              finance.data
                ? formatCurrency(finance.data.totalPendingRemittance)
                : undefined
            }
            tone="warning"
          />
        </div>
        {summary.isError ||
        onboarding.isError ||
        applications.isError ||
        finance.isError ? (
          <p className="mt-4 text-sm text-orange-700">
            Some overview metrics are temporarily unavailable. Refresh to try
            again.
          </p>
        ) : null}
      </section>

      <Card className="mt-6 p-4 sm:p-5">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Quick actions
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ icon: Icon, label, href }) => (
            <Link
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              href={href}
              key={label}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                  <Icon className="size-4" />
                </span>
                {label}
              </span>
              <ArrowRight className="size-4 text-slate-300 transition group-hover:text-slate-500" />
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Rent visibility
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Financial snapshot
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Collected funds remain accountable until they reach the landlord.
            </p>
          </div>
          {finance.isLoading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  className="h-24 animate-pulse rounded-xl bg-slate-100"
                  key={item}
                />
              ))}
            </div>
          ) : null}
          {finance.isError ? (
            <p className="mt-6 text-sm text-slate-500">
              Rent visibility is currently unavailable.
            </p>
          ) : null}
          {finance.data ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MoneyMetric
                label="Expected rent"
                value={finance.data.totalExpectedRent}
              />
              <MoneyMetric
                label="Received rent"
                value={finance.data.totalReceived}
                tone="positive"
              />
              <MoneyMetric
                label="Pending remittance"
                value={finance.data.totalPendingRemittance}
                tone="warning"
              />
            </div>
          ) : null}
        </Card>

        <Card className="flex flex-col justify-between bg-slate-950 p-6 text-white">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Portfolio records
            </p>
            <h2 className="mt-4 text-xl font-semibold">
              Keep every unit accounted for
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Add units and keep occupancy records clear across your portfolio.
            </p>
          </div>
          <Button
            asChild
            className="mt-7 w-full bg-white text-slate-950 hover:bg-slate-100"
          >
            <Link href="/properties">
              Manage properties <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Activity stream
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Recent operational activity
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link href="/payments">View records</Link>
          </Button>
        </div>
        {finance.isLoading || occupancy.isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                className="h-16 animate-pulse rounded-xl bg-slate-100"
                key={item}
              />
            ))}
          </div>
        ) : null}
        {finance.isError || occupancy.isError ? (
          <p className="mt-6 text-sm text-slate-500">
            Recent operational activity is currently unavailable.
          </p>
        ) : null}
        {!finance.isLoading &&
        !occupancy.isLoading &&
        !finance.isError &&
        !occupancy.isError ? (
          activity.length ? (
            <div className="mt-6 divide-y divide-slate-100">
              {activity.map((entry) => (
                <ActivityRow entry={entry} key={entry.id} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-slate-50 px-5 py-9 text-center">
              <p className="text-sm text-slate-500">
                No operational activity yet.
              </p>
            </div>
          )
        ) : null}
      </Card>
    </main>
  );
}

function TenantWorkspace() {
  const tenancies = useTenancies("");
  const activeTenancy = tenancies.data?.items.find(
    (tenancy) => tenancy.status === "active" || tenancy.status === "pending",
  );
  const payments = useTenancyPayments(activeTenancy?.id ?? "");
  const agreement = useTenancyAgreement(activeTenancy?.id ?? "");

  const nextPayment = payments.data
    ?.filter((payment) => ["pending", "overdue"].includes(payment.status))
    .sort(
      (left, right) =>
        new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
    )[0];

  const paidPayments =
    payments.data?.filter((payment) => payment.status === "paid") ?? [];

  const totalPaid = paidPayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const tenantName = activeTenancy?.user.profile
    ? `${activeTenancy.user.profile.firstName} ${activeTenancy.user.profile.lastName}`
    : activeTenancy?.user.email;

  const hasRentDue = Boolean(nextPayment && Number(nextPayment.amount) > 0);
  const tenantAgreementStatus = getTenantAgreementStatus(agreement.data?.status);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-5 lg:p-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7">
        <p className="text-sm font-medium text-emerald-700">
          Resident workspace
        </p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Welcome{tenantName ? `, ${tenantName.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              A calm place to view rent, agreements, maintenance and your home
              details.
            </p>
            {activeTenancy ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  {activeTenancy.property.name} / {activeTenancy.unit.name}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  Lease ends {formatFullDate(activeTenancy.endDate)}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-700">
                  {activeTenancy.status}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href={hasRentDue ? "/rent" : "/payments"}>
                {hasRentDue ? "Pay rent" : "View payment history"}
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto" variant="outline">
              <Link href="/agreement">View agreement</Link>
            </Button>
          </div>
        </div>
      </header>

      {tenancies.isLoading ? (
        <Card className="mt-8">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-6 h-28 animate-pulse rounded-xl bg-slate-100" />
        </Card>
      ) : null}

      {tenancies.isError ? (
        <Card className="mt-8 border-orange-100 bg-orange-50/50">
          <p className="text-sm text-orange-700">
            Your tenancy records are temporarily unavailable.
          </p>
        </Card>
      ) : null}

      {!tenancies.isLoading && !tenancies.isError && !activeTenancy ? (
        <Card className="mt-8 py-14 text-center">
          <KeyRound className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-4 font-semibold">No active tenancy yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your tenancy records will appear here once they are active.
          </p>
        </Card>
      ) : null}

      {activeTenancy ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200 bg-slate-950 p-5 text-white md:col-span-2 sm:p-6">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm text-emerald-300">Rent due</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {nextPayment
                      ? formatCurrency(nextPayment.amount)
                      : "No rent due"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {nextPayment
                      ? `Due ${formatFullDate(nextPayment.dueDate)}`
                      : "You have no pending rent record at the moment."}
                  </p>
                </div>
                {nextPayment ? <StatusBadge status={nextPayment.status} /> : null}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <TenantStat
                  label="Rent amount"
                  value={formatCurrency(activeTenancy.rentAmount)}
                />
                <TenantStat
                  label="Paid to date"
                  value={formatCurrency(totalPaid)}
                />
                <TenantStat
                  label="Frequency"
                  value={activeTenancy.paymentFrequency}
                />
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <p className="text-sm font-medium text-slate-500">Agreement</p>
              {agreement.isLoading ? (
                <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100" />
              ) : agreement.data ? (
                <>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <FileText className="size-5 text-emerald-700" />
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {tenantAgreementStatus}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-950">
                    {agreement.data.title}
                  </p>
                  <Button asChild className="mt-5 w-full" variant="ghost">
                    <Link href={`/tenancies/${activeTenancy.id}#agreement`}>
                      View agreement
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Your agreement will appear here once it is ready.
                </p>
              )}
            </Card>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    Payment history
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">
                    Recent rent records
                  </h2>
                </div>
                <Button asChild variant="ghost">
                  <Link href="/payments">View all</Link>
                </Button>
              </div>

              {payments.isLoading ? (
                <div className="mt-6 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      className="h-16 animate-pulse rounded-xl bg-slate-100"
                      key={item}
                    />
                  ))}
                </div>
              ) : null}

              {payments.data?.length ? (
                <div className="mt-6 divide-y divide-slate-100">
                  {payments.data.slice(0, 4).map((payment) => (
                    <Link
                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                      href={`/payments/${payment.id}`}
                      key={payment.id}
                    >
                      <span>
                        <span className="block text-sm font-medium text-slate-950">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          Due {formatFullDate(payment.dueDate)}
                        </span>
                      </span>
                      <StatusBadge status={payment.status} />
                    </Link>
                  ))}
                </div>
              ) : null}

              {!payments.isLoading && payments.data?.length === 0 ? (
                <div className="mt-6 rounded-xl bg-slate-50 px-5 py-9 text-center">
                  <p className="text-sm text-slate-500">
                    No payment records yet.
                  </p>
                </div>
              ) : null}
            </Card>

            <div className="space-y-6">
              <Card>
                <p className="text-sm font-medium text-emerald-700">
                  Your home
                </p>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  {activeTenancy.property.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {activeTenancy.property.address}, {activeTenancy.property.city}
                  , {activeTenancy.property.state}
                </p>
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Unit</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {activeTenancy.unit.name} / {activeTenancy.unit.unitType}
                  </p>
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Stay period</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatFullDate(activeTenancy.startDate)} -{" "}
                    {formatFullDate(activeTenancy.endDate)}
                  </p>
                </div>
              </Card>

              <Card className="bg-emerald-50/60">
                <LifeBuoy className="size-5 text-emerald-700" />
                <h2 className="mt-4 font-semibold text-slate-950">
                  Need help at home?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Send maintenance requests and resident messages from one calm
                  place as CasaX grows.
                </p>
                <Button asChild className="mt-5 w-full" variant="ghost">
                  <Link href="/maintenance">Open maintenance</Link>
                </Button>
              </Card>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function CaretakerDashboard() {
  const applications = useApplicationsSummary();
  const onboarding = useTenantOnboardingRequests();
  const tenancies = useTenancies("");
  const finance = usePaymentSummary();
  const pendingOnboarding =
    onboarding.data?.filter((request) => request.status === "pending").length;
  const activeTenancies =
    tenancies.data?.items.filter((tenancy) => tenancy.status === "active")
      .length ?? 0;

  return (
    <main className="mx-auto max-w-6xl p-5 lg:p-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Caretaker workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Assigned property work
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Focused tools for applicant intake, tenant submissions, rent
            records and day-to-day resident support.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/applications/new">Create application</Link>
        </Button>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PrimaryMetric
          icon={ClipboardPlus}
          label="Pending applications"
          loading={applications.isLoading}
          value={applications.data?.pendingApprovals}
          tone="warning"
        />
        <PrimaryMetric
          icon={UserPlus}
          label="Tenant submissions"
          loading={onboarding.isLoading}
          value={pendingOnboarding}
          tone="warning"
        />
        <PrimaryMetric
          icon={KeyRound}
          label="Active tenancies"
          loading={tenancies.isLoading}
          value={activeTenancies}
        />
        <PrimaryMetric
          icon={ReceiptText}
          label="Rent received"
          loading={finance.isLoading}
          value={
            finance.data ? formatCurrency(finance.data.totalReceived) : undefined
          }
          tone="positive"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <p className="text-sm font-medium text-emerald-700">
            Today queue
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            Items needing attention
          </h2>
          <div className="mt-6 grid gap-3">
            <QueueLink
              href="/applications"
              icon={ClipboardPlus}
              label="Review applicant records"
              value={`${applications.data?.pendingApprovals ?? 0} pending`}
            />
            <QueueLink
              href="/tenant-onboarding-requests"
              icon={UserPlus}
              label="Tenant submissions"
              value={`${pendingOnboarding ?? 0} awaiting review`}
            />
            <QueueLink
              href="/payments"
              icon={CreditCard}
              label="Payment records"
              value="Record and verify rent"
            />
            <QueueLink
              href="/maintenance"
              icon={LifeBuoy}
              label="Resident support"
              value="Track maintenance requests"
            />
          </div>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CalendarDays className="size-5 text-emerald-300" />
          <h2 className="mt-4 text-xl font-semibold">
            Keep assigned units current
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Submit applicants, record rent, and keep resident issues visible
            without portfolio-level administration.
          </p>
          <Button
            asChild
            className="mt-7 w-full bg-white text-slate-950 hover:bg-slate-100"
          >
            <Link href="/tenancies">View tenancies</Link>
          </Button>
        </Card>
      </section>
    </main>
  );
}

function TenantStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold capitalize text-white">
        {value}
      </p>
    </div>
  );
}

function QueueLink({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <Link
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/40"
      href={href}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-950">
            {label}
          </span>
          <span className="mt-1 block truncate text-xs text-slate-500">
            {value}
          </span>
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-slate-300" />
    </Link>
  );
}

function PrimaryMetric({
  icon: Icon,
  label,
  loading,
  value,
  tone = "default",
}: {
  icon: ElementType;
  label: string;
  loading: boolean;
  value?: number | string;
  tone?: "default" | "positive" | "warning";
}) {
  const iconTone =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-orange-50 text-orange-600"
        : "bg-slate-50 text-slate-600";

  return (
    <Card className="p-5 sm:p-6">
      <div
        className={`flex size-10 items-center justify-center rounded-xl ${iconTone}`}
      >
        <Icon className="size-5" />
      </div>
      <p className="mt-6 text-sm text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-2 h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-2 truncate text-3xl font-semibold tracking-tight text-slate-950">
          {value ?? "--"}
        </p>
      )}
    </Card>
  );
}

function MoneyMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "positive" | "warning";
}) {
  return (
    <div
      className={`min-w-0 rounded-xl p-4 ${
        tone === "positive"
          ? "bg-emerald-50/70"
          : tone === "warning"
            ? "bg-orange-50/70"
            : "bg-slate-50"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-slate-950">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function ActivityRow({ entry }: { entry: ActivityItem }) {
  const Icon = entry.icon;
  const iconTone =
    entry.tone === "positive"
      ? "bg-emerald-50 text-emerald-700"
      : entry.tone === "warning"
        ? "bg-orange-50 text-orange-600"
        : "bg-slate-50 text-slate-500";

  return (
    <Link
      className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
      href={entry.href}
    >
      <span
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${iconTone}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-950">
          {entry.title}
        </span>
        <span className="mt-1 block truncate text-sm text-slate-500">
          {entry.detail}
        </span>
      </span>
      <span className="shrink-0 pt-1 text-xs text-slate-400">
        {formatActivityDate(entry.date)}
      </span>
    </Link>
  );
}

function buildActivity(
  payments: NonNullable<
    ReturnType<typeof usePaymentSummary>["data"]
  >["recentPayments"],
  remittances: NonNullable<
    ReturnType<typeof usePaymentSummary>["data"]
  >["recentRemittances"],
  occupancyRecords: NonNullable<
    ReturnType<typeof useOccupancySummary>["data"]
  >["recentActivity"],
): ActivityItem[] {
  return [
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      icon: ReceiptText,
      title: "Payment recorded",
      detail: `${payment.property.name} / ${payment.unit.name} / ${formatCurrency(payment.amount)}`,
      date: payment.paidAt ?? payment.createdAt,
      href: `/payments/${payment.id}`,
      tone:
        payment.status === "paid"
          ? ("positive" as const)
          : ("default" as const),
    })),
    ...remittances.map((remittance) => ({
      id: `remittance-${remittance.id}`,
      icon: Wallet,
      title:
        remittance.status === "remitted"
          ? "Remittance recorded"
          : "Remittance pending",
      detail: `${remittance.property.name} / ${formatCurrency(remittance.amount)}`,
      date: remittance.remittedAt ?? remittance.createdAt,
      href: `/remittances/${remittance.id}`,
      tone:
        remittance.status === "remitted"
          ? ("positive" as const)
          : ("warning" as const),
    })),
    ...occupancyRecords.map((record) => ({
      id: `occupancy-${record.id}`,
      icon: ShieldCheck,
      title: "Tenancy converted",
      detail: `${record.property.name} / ${record.unit.name}`,
      date: record.moveInDate,
      href: `/units/${record.unit.id}/occupancy-history`,
      tone: "positive" as const,
    })),
  ]
    .sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    )
    .slice(0, 6);
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getTenantAgreementStatus(status?: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "generated":
      return "Ready soon";
    case "sent":
      return "Ready to review";
    case "signed":
      return "Signed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Agreement ready";
  }
}