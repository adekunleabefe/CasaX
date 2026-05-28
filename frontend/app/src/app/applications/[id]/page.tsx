"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Home,
  Mail,
  UserRound,
} from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { RejectionForm } from "@/components/operations/rejection-form";
import { StatusBadge } from "@/components/operations/status-badge";
import { TenancyConversionForm } from "@/components/operations/tenancy-conversion-form";
import { ApplicationUpdateForm } from "@/components/operations/application-update-form";
import { useCurrentUser } from "@/features/auth/queries";
import {
  useApplication,
  useApplicationDecision,
  useUpdateApplication,
} from "@/features/operations/queries";
import { useConvertApplication } from "@/features/tenancies/queries";

export default function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showConversion, setShowConversion] = useState(false);
  const application = useApplication(id);
  const currentUser = useCurrentUser();
  const decision = useApplicationDecision(id, application.data?.propertyId);
  const update = useUpdateApplication(id);
  const conversion = useConvertApplication(id, application.data?.propertyId);

  if (application.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }
  if (application.isError || !application.data) {
    return (
      <main className="p-5 lg:p-8">
        <ErrorState
          title="Unable to load this application"
          onRetry={() => void application.refetch()}
        />
      </main>
    );
  }

  const record = application.data;
  const applicantProfile = record.applicant.user.profile;
  const caretakerProfile = record.assignedCaretaker?.user.profile;
  const isLandlord = currentUser.data?.role === "landlord";
  const isStaff = isLandlord || currentUser.data?.role === "caretaker";
  const isFinalized = ["approved", "rejected", "converted_to_tenant"].includes(
    record.status,
  );
  const canDecide = isLandlord && !isFinalized;
  const canConvert = isLandlord && record.status === "approved";

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Application review"
        title={
          applicantProfile
            ? `${applicantProfile.firstName} ${applicantProfile.lastName}`
            : record.applicant.user.email
        }
        description={`${record.property.name} / ${record.unit.name}`}
        backHref="/applications"
        action={<StatusBadge status={record.status} />}
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <div className="grid gap-6 sm:grid-cols-2">
              <Info
                icon={Mail}
                label="Applicant email"
                value={record.applicant.user.email}
              />
              <Info
                icon={UserRound}
                label="Submitted through"
                value={
                  caretakerProfile
                    ? `${caretakerProfile.firstName} ${caretakerProfile.lastName}`
                    : "Direct landlord workflow"
                }
              />
              <Info
                icon={Home}
                label="Unit"
                value={`${record.unit.unitType} / ${record.unit.bedroomCount} bedroom`}
              />
              <Info
                icon={CalendarClock}
                label="Annual rent"
                value={formatCurrency(record.unit.rentAmount)}
              />
            </div>
            {record.notes ? (
              <div className="mt-7 border-t border-slate-100 pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Application notes
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {record.notes}
                </p>
              </div>
            ) : null}
          </Card>
          <Card>
            <h2 className="font-semibold">Application timeline</h2>
            <div className="mt-6 space-y-5">
              <TimelineItem
                detail={`Submitted by ${record.createdBy.email}`}
                label="Application submitted"
                time={record.createdAt}
              />
              {record.approvalHistory.map((event) => (
                <TimelineItem
                  detail={
                    event.note
                      ? event.note
                      : `Updated by ${event.reviewedBy.email}`
                  }
                  key={event.id}
                  label={`Status changed to ${event.toStatus.replaceAll("_", " ")}`}
                  time={event.createdAt}
                />
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          {isStaff && !isFinalized ? (
            <Card>
              <h2 className="font-semibold">Operational workflow</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Keep inspection and review progress current before the final
                landlord decision.
              </p>
              <ApplicationUpdateForm
                application={record}
                error={update.error?.message}
                isPending={update.isPending}
                onSubmit={(input) =>
                  update.mutateAsync(input).then(() => undefined)
                }
              />
            </Card>
          ) : null}
          {isLandlord ? (
            <Card className="bg-slate-950 text-white">
              <ClipboardCheck className="size-6 text-emerald-400" />
              <h2 className="mt-5 text-lg font-semibold">Landlord decision</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Approval holds this unit for the future tenancy creation step.
                Rejection returns it to vacant inventory.
              </p>
              {canDecide ? (
                <>
                  <Button
                    className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={decision.approve.isPending}
                    onClick={() => decision.approve.mutate()}
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    {decision.approve.isPending
                      ? "Approving..."
                      : "Approve application"}
                  </Button>
                  <RejectionForm
                    isPending={decision.reject.isPending}
                    onReject={(reason) =>
                      decision.reject.mutateAsync(reason).then(() => undefined)
                    }
                  />
                </>
              ) : (
                <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm text-slate-200">
                  This application decision has been recorded.
                </div>
              )}
              {decision.approve.error || decision.reject.error ? (
                <p className="mt-4 text-sm text-orange-300">
                  {(decision.approve.error ?? decision.reject.error)?.message}
                </p>
              ) : null}
            </Card>
          ) : null}
          {canConvert ? (
            <Card>
              <p className="text-sm font-medium text-emerald-700">
                Approved applicant
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Ready for occupancy
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create the tenancy and official occupant record once unit
                assignment and lease terms are confirmed.
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() => setShowConversion(true)}
              >
                Convert to tenancy
              </Button>
            </Card>
          ) : null}
        </div>
      </div>
      {showConversion ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
          role="dialog"
        >
          <Card className="w-full max-w-2xl shadow-2xl">
            <h2 className="text-xl font-semibold">Convert to tenancy</h2>
            <p className="mt-2 text-sm text-slate-500">
              Confirm lease terms to create occupancy for {record.unit.name}.
            </p>
            <div className="mt-6">
              <TenancyConversionForm
                error={conversion.error?.message}
                isPending={conversion.isPending}
                onCancel={() => setShowConversion(false)}
                onSubmit={async (values) => {
                  const tenancy = await conversion.mutateAsync(values);
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
                rentAmount={record.unit.rentAmount}
              />
            </div>
          </Card>
        </div>
      ) : null}
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

function TimelineItem({
  label,
  detail,
  time,
}: {
  label: string;
  detail: string;
  time: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
      <div>
        <p className="text-sm font-medium capitalize">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
        <p className="mt-2 text-xs text-slate-400">
          {new Date(time).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
