"use client";

import { useParams, useRouter } from "next/navigation";
import { CalendarRange, Home, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { RejectionForm } from "@/components/operations/rejection-form";
import { StatusBadge } from "@/components/operations/status-badge";
import { useCurrentUser } from "@/features/auth/queries";
import {
  useTenantOnboardingDecision,
  useTenantOnboardingRequest,
} from "@/features/onboarding/queries";

export default function TenantOnboardingRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const record = useTenantOnboardingRequest(id);
  const currentUser = useCurrentUser();
  const decision = useTenantOnboardingDecision(id, record.data?.unitId);

  if (record.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }
  if (record.isError || !record.data) {
    return (
      <main className="p-5 lg:p-8">
        <ErrorState
          title="Unable to load onboarding request"
          onRetry={() => void record.refetch()}
        />
      </main>
    );
  }

  const request = record.data;
  const isLandlord = currentUser.data?.role === "landlord";
  const canDecide = isLandlord && request.status === "pending";
  const caretaker = request.submittedByCaretaker?.user.profile;
  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Tenant onboarding request"
        title={`${request.firstName} ${request.lastName}`}
        description={`${request.property.name} / ${request.unit.name}`}
        backHref="/tenant-onboarding-requests"
        action={<StatusBadge status={request.status} />}
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_350px]">
        <Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Info
              icon={Mail}
              label="Tenant contact"
              value={request.email ?? request.phone ?? "Not provided"}
            />
            <Info icon={Home} label="Unit" value={`${request.unit.unitType} / ${request.unit.name}`} />
            <Info
              icon={CalendarRange}
              label="Lease dates"
              value={`${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}`}
            />
            <Info
              icon={UserRound}
              label="Submitted through"
              value={
                caretaker
                  ? `${caretaker.firstName} ${caretaker.lastName}`
                  : "Landlord submission"
              }
            />
          </div>
          <div className="mt-7 rounded-xl bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Rent terms
            </p>
            <p className="mt-2 font-medium">
              {formatCurrency(request.rentAmount)} / {request.paymentFrequency}
            </p>
            {request.notes ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{request.notes}</p>
            ) : null}
          </div>
          {request.rejectionReason ? (
            <p className="mt-5 rounded-xl bg-orange-50 p-4 text-sm text-orange-700">
              {request.rejectionReason}
            </p>
          ) : null}
        </Card>
        {isLandlord ? (
          <Card className="bg-slate-950 text-white">
            <ShieldCheck className="size-6 text-emerald-400" />
            <h2 className="mt-5 text-lg font-semibold">Landlord approval</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Approval creates tenancy, occupancy, and an agreement draft in
              one recorded transaction.
            </p>
            {canDecide ? (
              <>
                <Button
                  className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={decision.approve.isPending}
                  onClick={async () => {
                    const tenancy = await decision.approve.mutateAsync();
                    const notice =
                      tenancy.invitationOutcome === "sent"
                        ? "?onboarding=invitation-sent"
                        : tenancy.invitationOutcome === "email_missing"
                          ? "?onboarding=email-missing"
                          : tenancy.invitationOutcome === "delivery_failed"
                            ? "?onboarding=delivery-failed"
                          : "";
                    router.push(`/tenancies/${tenancy.id}${notice}`);
                  }}
                >
                  {decision.approve.isPending ? "Approving..." : "Approve and create tenancy"}
                </Button>
                <RejectionForm
                  isPending={decision.reject.isPending}
                  onReject={(reason) => decision.reject.mutateAsync(reason).then(() => undefined)}
                />
              </>
            ) : (
              <p className="mt-6 rounded-xl bg-white/10 p-4 text-sm text-slate-200">
                This onboarding decision has been recorded.
              </p>
            )}
            {decision.approve.error || decision.reject.error ? (
              <p className="mt-4 text-sm text-orange-300">
                {(decision.approve.error ?? decision.reject.error)?.message}
              </p>
            ) : null}
          </Card>
        ) : null}
      </div>
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
