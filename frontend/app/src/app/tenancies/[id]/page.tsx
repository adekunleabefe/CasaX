"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  CalendarRange,
  FileText,
  Home,
  Mail,
  ReceiptText,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { TenancyUpdateForm } from "@/components/operations/tenancy-update-form";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import {
  useTenancy,
  useCreateTenancyAgreement,
  useMarkAgreementSigned,
  useSendTenancyAgreement,
  useTerminateTenancy,
  useTenancyAgreement,
  useUpdateTenancyAgreement,
  useUpdateTenancy,
} from "@/features/tenancies/queries";
import { useTenancyPayments } from "@/features/finance/queries";
import { useCurrentUser } from "@/features/auth/queries";

export default function TenancyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const onboardingNotice = useSearchParams().get("onboarding");
  const tenancy = useTenancy(id);
  const terminate = useTerminateTenancy(
    id,
    tenancy.data?.unitId,
    tenancy.data?.propertyId,
  );
  const update = useUpdateTenancy(id);
  const payments = useTenancyPayments(id);
  const currentUser = useCurrentUser();
  const agreement = useTenancyAgreement(id);
  const createAgreement = useCreateTenancyAgreement(id);
  const updateAgreement = useUpdateTenancyAgreement(id, agreement.data?.id);
  const sendAgreement = useSendTenancyAgreement(id, agreement.data?.id);
  const markSigned = useMarkAgreementSigned(id, agreement.data?.id);
  const [editing, setEditing] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(false);
  const [agreementTitle, setAgreementTitle] = useState("");
  const [agreementContent, setAgreementContent] = useState("");

  if (tenancy.isLoading)
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  if (tenancy.isError || !tenancy.data) {
    return (
      <main className="p-5 lg:p-8">
        <ErrorState
          title="Unable to load this tenancy"
          onRetry={() => void tenancy.refetch()}
        />
      </main>
    );
  }

  const record = tenancy.data;
  const tenant = record.user.profile;
  const active = record.status === "active" || record.status === "pending";
  const isLandlord = currentUser.data?.role === "landlord";
  const isTenant = currentUser.data?.role === "tenant";
  const canRecordPayment = isLandlord || currentUser.data?.role === "caretaker";
  const canRenew =
    isLandlord && (record.status === "active" || record.status === "expired");

  if (isTenant) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <p className="text-sm font-medium text-emerald-700">My home</p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {record.property.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {record.unit.name} / {record.unit.unitType}
              </p>
            </div>
            <StatusBadge status={record.status} />
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <p className="text-sm font-medium text-emerald-700">
              Residence summary
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info
                icon={Home}
                label="Address"
                value={`${record.property.address}, ${record.property.city}, ${record.property.state}`}
              />
              <Info
                icon={CalendarRange}
                label="Lease period"
                value={`${new Date(record.startDate).toLocaleDateString()} - ${new Date(record.endDate).toLocaleDateString()}`}
              />
              <Info
                icon={ReceiptText}
                label="Rent"
                value={`${formatCurrency(record.rentAmount)} / ${record.paymentFrequency}`}
              />
              <Info
                icon={Mail}
                label="Account email"
                value={record.user.email}
              />
            </div>
          </Card>

          <Card className="bg-slate-950 text-white">
            <FileText className="size-5 text-emerald-300" />
            <h2 className="mt-4 text-xl font-semibold">Agreement</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Review your agreement status and lease details.
            </p>
            {agreement.data ? (
              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-300">Status</p>
                <p className="mt-1 text-sm font-semibold capitalize text-white">
                  {agreement.data.status}
                </p>
              </div>
            ) : null}
            <Button
              asChild
              className="mt-6 w-full bg-white text-slate-950 hover:bg-slate-100"
            >
              <Link href="#agreement">View agreement</Link>
            </Button>
          </Card>
        </section>

        <Card className="mt-6 scroll-mt-24" id="agreement">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Tenancy agreement
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Agreement document
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your tenancy agreement will appear here once issued.
              </p>
            </div>
            {agreement.data ? <StatusBadge status={agreement.data.status} /> : null}
          </div>
          {agreement.isLoading ? (
            <div className="mt-6 h-32 animate-pulse rounded-xl bg-slate-100" />
          ) : null}
          {agreement.data ? (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="font-medium text-slate-950">
                {agreement.data.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {agreement.data.agreementNumber} / Updated{" "}
                {new Date(agreement.data.updatedAt).toLocaleDateString()}
              </p>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {agreement.data.content}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button variant="outline">Download PDF</Button>
                <Button asChild>
                  <Link href="/documents">View documents</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="mt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Payment history
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Rent records
              </h2>
            </div>
            <Button asChild variant="ghost">
              <Link href="/payments">View all payments</Link>
            </Button>
          </div>
          {payments.isLoading ? (
            <div className="mt-6 h-20 animate-pulse rounded-xl bg-slate-100" />
          ) : null}
          {payments.data?.length === 0 ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No rent records yet. Your invoices and receipts will appear here.
            </p>
          ) : null}
          {payments.data?.length ? (
            <div className="mt-6 divide-y divide-slate-100">
              {payments.data.map((payment) => (
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
                      Due {new Date(payment.dueDate).toLocaleDateString()}
                    </span>
                  </span>
                  <StatusBadge status={payment.status} />
                </Link>
              ))}
            </div>
          ) : null}
        </Card>
      </main>
    );
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Tenancy record"
        title={
          tenant ? `${tenant.firstName} ${tenant.lastName}` : record.user.email
        }
        description={`${record.property.name} / ${record.unit.name}`}
        backHref="/tenancies"
        action={<StatusBadge status={record.status} />}
      />
      {onboardingNotice === "invitation-sent" ? (
        <Card className="mt-6 border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
          Tenant invitation email sent successfully.
        </Card>
      ) : onboardingNotice === "email-missing" ? (
        <Card className="mt-6 border-orange-100 bg-orange-50/60 p-4 text-sm text-orange-800">
          Tenant created without account invitation. Add an email address later
          to enable tenant access.
        </Card>
      ) : onboardingNotice === "delivery-failed" ? (
        <Card className="mt-6 border-orange-100 bg-orange-50/60 p-4 text-sm text-orange-800">
          Tenant created, but invitation email delivery is not configured or
          could not be completed.
        </Card>
      ) : null}
      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Info icon={Mail} label="Tenant email" value={record.user.email} />
            <Info
              icon={Home}
              label="Unit"
              value={`${record.unit.unitType} / ${record.unit.name}`}
            />
            <Info
              icon={CalendarRange}
              label="Lease dates"
              value={`${new Date(record.startDate).toLocaleDateString()} - ${new Date(record.endDate).toLocaleDateString()}`}
            />
            <Info
              icon={ReceiptText}
              label="Rent terms"
              value={`${formatCurrency(record.rentAmount)} / ${record.paymentFrequency}`}
            />
          </div>
          {record.notes ? (
            <div className="mt-7 border-t border-slate-100 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notes
              </p>
              <p className="mt-3 text-sm text-slate-600">{record.notes}</p>
            </div>
          ) : null}
        </Card>
        <Card>
          <UserRound className="size-6 text-emerald-600" />
          <h2 className="mt-4 font-semibold">Occupancy control</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ending this tenancy closes the active occupancy record and returns
            the unit to vacant inventory.
          </p>
          {canRenew ? (
            <Button asChild className="mt-6 w-full">
              <Link href={`/tenancies/${record.id}/renew`}>
                <RefreshCw className="mr-2 size-4" />
                Renew tenancy
              </Link>
            </Button>
          ) : null}
          {isLandlord && active ? (
            <>
              <Button
                className="mt-3 w-full"
                onClick={() => setEditing((visible) => !visible)}
                variant="outline"
              >
                {editing ? "Close editing" : "Edit tenancy"}
              </Button>
              <Button
                className="mt-3 w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                disabled={terminate.isPending}
                onClick={() => {
                  const reason =
                    window.prompt("Reason for termination (optional)") ??
                    undefined;
                  void terminate.mutateAsync(reason);
                }}
                variant="outline"
              >
                {terminate.isPending ? "Terminating..." : "Terminate tenancy"}
              </Button>
            </>
          ) : !active ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              This tenancy is closed.
            </p>
          ) : null}
          {terminate.error ? (
            <p className="mt-4 text-sm text-orange-700">
              {terminate.error.message}
            </p>
          ) : null}
          <Button asChild className="mt-3 w-full" variant="outline">
            <Link href="#agreement">View agreement</Link>
          </Button>
          {canRecordPayment && agreement.data ? (
            <Button asChild className="mt-3 w-full" variant="outline">
              <Link href={`/payments/new?tenancyId=${record.id}`}>
                Record payment
              </Link>
            </Button>
          ) : null}
        </Card>
      </div>
      {editing && isLandlord && active ? (
        <Card className="mt-6">
          <h2 className="font-semibold">Edit lease terms</h2>
          <p className="mt-2 text-sm text-slate-500">
            Update active tenancy terms while retaining its occupancy history.
          </p>
          <TenancyUpdateForm
            error={update.error?.message}
            isPending={update.isPending}
            onCancel={() => setEditing(false)}
            onSubmit={(input) =>
              update.mutateAsync(input).then(() => undefined)
            }
            tenancy={record}
          />
        </Card>
      ) : null}
      <Card className="mt-6 scroll-mt-6" id="agreement">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Tenancy agreement
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Occupancy agreement record
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Payments are enabled once an agreement draft exists.
            </p>
          </div>
          {agreement.data ? (
            <StatusBadge status={agreement.data.status} />
          ) : null}
        </div>
        {agreement.isLoading ? (
          <div className="mt-6 h-32 animate-pulse rounded-xl bg-slate-100" />
        ) : null}
        {agreement.data ? (
          <>
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 size-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium">{agreement.data.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {agreement.data.agreementNumber} / Generated{" "}
                    {new Date(agreement.data.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {!editingAgreement ? (
                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {agreement.data.content}
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    onChange={(event) => setAgreementTitle(event.target.value)}
                    value={agreementTitle}
                  />
                  <textarea
                    className="min-h-64 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-emerald-500"
                    onChange={(event) =>
                      setAgreementContent(event.target.value)
                    }
                    value={agreementContent}
                  />
                </div>
              )}
            </div>
            {isLandlord ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {editingAgreement ? (
                  <>
                    <Button
                      disabled={updateAgreement.isPending}
                      onClick={async () => {
                        await updateAgreement.mutateAsync({
                          title: agreementTitle,
                          content: agreementContent,
                        });
                        setEditingAgreement(false);
                      }}
                    >
                      Save agreement
                    </Button>
                    <Button
                      onClick={() => setEditingAgreement(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setAgreementTitle(agreement.data.title);
                      setAgreementContent(agreement.data.content);
                      setEditingAgreement(true);
                    }}
                    variant="outline"
                  >
                    Edit draft
                  </Button>
                )}
                {agreement.data.status !== "signed" ? (
                  <>
                    <Button
                      disabled={sendAgreement.isPending}
                      onClick={() => sendAgreement.mutate()}
                      variant="outline"
                    >
                      <Send className="mr-2 size-4" />
                      Send agreement
                    </Button>
                    <Button
                      disabled={markSigned.isPending}
                      onClick={() => markSigned.mutate()}
                      variant="outline"
                    >
                      Mark signed
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
        {agreement.isError ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">
              No agreement record is available for this tenancy yet.
            </p>
            {isLandlord ? (
              <Button
                className="mt-4"
                disabled={createAgreement.isPending}
                onClick={() => createAgreement.mutate({})}
                variant="outline"
              >
                Create agreement draft
              </Button>
            ) : null}
          </div>
        ) : null}
        {updateAgreement.error ||
        sendAgreement.error ||
        markSigned.error ||
        createAgreement.error ? (
          <p className="mt-4 text-sm text-orange-700">
            {
              (
                updateAgreement.error ??
                sendAgreement.error ??
                markSigned.error ??
                createAgreement.error
              )?.message
            }
          </p>
        ) : null}
      </Card>
      <Card className="mt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Payment history
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Rent received for this tenancy
            </h2>
          </div>
          {canRecordPayment && agreement.data ? (
            <Button asChild>
              <Link href={`/payments/new?tenancyId=${record.id}`}>
                Record payment
              </Link>
            </Button>
          ) : null}
        </div>
        {canRecordPayment && !agreement.isLoading && !agreement.data ? (
          <p className="mt-5 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
            Create an agreement draft before recording payments.
          </p>
        ) : null}
        {payments.isLoading ? (
          <div className="mt-6 h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : null}
        {payments.isError ? (
          <p className="mt-6 text-sm text-orange-700">
            Payment history could not be loaded.
          </p>
        ) : null}
        {payments.data?.length === 0 ? (
          <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            No payment records have been created for this tenancy.
          </p>
        ) : null}
        {payments.data?.length ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
            {payments.data.map((payment) => (
              <Link
                className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center"
                href={`/payments/${payment.id}`}
                key={payment.id}
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Due {new Date(payment.dueDate).toLocaleDateString()} /{" "}
                    {payment.collectedByCaretaker
                      ? "Caretaker collected"
                      : "Direct receipt"}
                  </p>
                </div>
                <StatusBadge status={payment.status} />
              </Link>
            ))}
          </div>
        ) : null}
      </Card>
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 text-emerald-600" />
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
