"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, Home, MapPin } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { ApplicationStatusChip } from "@/components/applicant/status-chip";
import { useApplications } from "@/lib/applicant-queries";

export default function AccountApplicationsPage() {
  const applications = useApplications();
  const rows = applications.data?.items ?? [];

  return (
    <>
      {applications.isLoading ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              className="h-64 animate-pulse rounded-[1.75rem] bg-slate-100"
              key={item}
            />
          ))}
        </div>
      ) : null}
      {rows.length === 0 && !applications.isLoading ? (
        <EmptyState />
      ) : null}
      {rows.length > 0 ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {rows.map((application) => (
            <Link
              className="group block"
              href={`/applicant/applications/${application.id}`}
              key={application.id}
            >
              <Card className="h-full border-slate-200 bg-white shadow-sm shadow-slate-200/50 transition group-hover:border-emerald-100 group-hover:shadow-md">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <ClipboardCheck className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                        {application.property.name}
                      </h2>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="size-4 text-slate-400" />
                        {application.property.city}, {application.property.state}
                      </p>
                    </div>
                  </div>
                  <ApplicationStatusChip status={application.status} />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Fact icon={Home} label="Unit" value={application.unit.name} />
                  <Fact
                    icon={FileText}
                    label="Annual rent"
                    value={formatCurrency(application.unit.rentAmount)}
                  />
                  <Fact
                    icon={ClipboardCheck}
                    label="Next step"
                    value={nextStep(application.status)}
                  />
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  View application timeline
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}

function EmptyState() {
  return (
    <Card className="mt-8 overflow-hidden border-slate-200 bg-white p-0 text-center shadow-sm shadow-slate-200/50">
      <div className="bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)] px-6 py-14">
        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-white text-emerald-700 shadow-sm">
          <ClipboardCheck className="size-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-slate-950">
          When you&apos;re ready, apply with confidence.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Track application updates and next steps from CasaX.
        </p>
        <Button asChild className="mt-7 rounded-2xl">
          <Link href="/rentals">Browse rentals</Link>
        </Button>
      </div>
    </Card>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <Icon className="size-4 text-emerald-700" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function nextStep(status: string) {
  const labels: Record<string, string> = {
    pending: "CasaX review",
    inspection_required: "Book inspection",
    inspection_scheduled: "Attend inspection",
    inspection_booked: "Attend inspection",
    under_review: "Await review outcome",
    approved: "Onboarding next step",
    rejected: "Review closed",
    converted_to_tenant: "Resident portal",
    converted_to_resident: "Resident portal",
  };
  return labels[status] ?? "CasaX review";
}
