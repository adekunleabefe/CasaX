"use client";

import { useParams } from "next/navigation";
import {
  CalendarClock,
  ClipboardCheck,
  Home,
  Mail,
  UserRound,
} from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { ApplicationUpdateForm } from "@/components/operations/application-update-form";
import { useCurrentUser } from "@/features/auth/queries";
import {
  useApplication,
  useUpdateApplication,
} from "@/features/operations/queries";

export default function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const application = useApplication(id);
  const currentUser = useCurrentUser();
  const update = useUpdateApplication(id);

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
  const isStaff = currentUser.data?.role === "caretaker";
  const isFinalized = ["approved", "rejected", "converted_to_tenant"].includes(
    record.status,
  );

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
                label="Source"
                value={
                  caretakerProfile
                    ? "CasaX field submission"
                    : "CasaX review workflow"
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
              <h2 className="font-semibold">Review workflow</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Keep inspection and review progress current before the final
                decision is recorded.
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
              <h2 className="mt-5 text-lg font-semibold">
                CasaX review status
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                CasaX coordinates applicant review, inspection progress, and
                resident onboarding. Landlords can monitor the status here.
              </p>
              <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm text-slate-200">
                Current status: {record.status.replaceAll("_", " ")}.
              </div>
              <Button asChild className="mt-4 w-full" variant="outline">
                <a href="mailto:hello@casax.ng?subject=Application%20status%20update">
                  Request update from CasaX
                </a>
              </Button>
            </Card>
          ) : null}
        </div>
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
