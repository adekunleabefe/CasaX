"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ClipboardCheck, Plus } from "lucide-react";
import type { ApplicationStatus } from "@casax/types";
import { Button, Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useApplications } from "@/features/operations/queries";

const statuses: { label: string; value: ApplicationStatus | "" }[] = [
  { label: "All applications", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Inspection booked", value: "inspection_booked" },
  { label: "Under review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function ApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const applications = useApplications(status);

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Applications"
        title="Applicant review queue"
        description="Review property applicants with caretaker attribution and transparent decision history."
        action={
          <Button asChild>
            <Link href="/applications/new">
              <Plus className="mr-2 size-4" />
              New application
            </Link>
          </Button>
        }
      />
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {statuses.map((item) => (
          <button
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              status === item.value
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
            key={item.label}
            onClick={() => setStatus(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="mt-5">
        {applications.isLoading ? <LoadingCards /> : null}
        {applications.isError ? (
          <ErrorState
            title="Unable to load applications"
            onRetry={() => void applications.refetch()}
          />
        ) : null}
        {applications.data?.items.length === 0 ? (
          <Card className="py-14 text-center">
            <ClipboardCheck className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No applications in this view</h2>
            <p className="mt-2 text-sm text-slate-500">
              New submissions and review decisions will appear here.
            </p>
          </Card>
        ) : null}
        {applications.data?.items.length ? (
          <Card className="overflow-hidden p-0">
            <div className="hidden grid-cols-[1.3fr_1.15fr_1fr_150px_40px] gap-4 border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
              <span>Applicant</span>
              <span>Property / unit</span>
              <span>Submitted through</span>
              <span>Status</span>
              <span />
            </div>
            {applications.data.items.map((application) => {
              const profile = application.applicant.user.profile;
              const caretaker = application.assignedCaretaker?.user.profile;
              return (
                <Link
                  className="grid gap-3 border-b border-slate-100 px-5 py-5 transition last:border-b-0 hover:bg-slate-50 lg:grid-cols-[1.3fr_1.15fr_1fr_150px_40px] lg:items-center lg:px-6"
                  href={`/applications/${application.id}`}
                  key={application.id}
                >
                  <div>
                    <p className="font-medium">
                      {profile
                        ? `${profile.firstName} ${profile.lastName}`
                        : application.applicant.user.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {application.applicant.user.email}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{application.property.name}</p>
                    <p className="mt-1 text-slate-500">
                      {application.unit.name}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {caretaker
                      ? `${caretaker.firstName} ${caretaker.lastName}`
                      : "Direct landlord submission"}
                  </p>
                  <StatusBadge status={application.status} />
                  <ArrowRight className="hidden size-4 text-slate-400 lg:block" />
                </Link>
              );
            })}
          </Card>
        ) : null}
      </section>
    </main>
  );
}
