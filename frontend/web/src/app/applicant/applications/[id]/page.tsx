"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Clock, FileText } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { ApplicationStatusChip } from "@/components/applicant/status-chip";
import { useApplication } from "@/lib/applicant-queries";

export default function AccountApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const application = useApplication(params.id);
  const record = application.data;

  if (application.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (!record) {
    return (
      <Card className="py-14 text-center">
        <ClipboardCheck className="mx-auto size-8 text-slate-400" />
        <h1 className="mt-4 text-lg font-semibold text-slate-950">
          Application not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          This application may no longer be available from your account.
        </p>
        <Button asChild className="mt-7">
          <Link href="/applicant/applications">Back to applications</Link>
        </Button>
      </Card>
    );
  }

  const events =
    record.approvalHistory.length > 0
      ? record.approvalHistory
      : [
          {
            id: record.id,
            toStatus: record.status,
            fromStatus: "submitted" as const,
            note: record.notes,
            createdAt: record.createdAt,
            reviewedBy: { email: "CasaX" },
          },
        ];

  return (
    <>
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        href="/applicant/applications"
      >
        <ArrowLeft className="size-4" />
        Back to applications
      </Link>

      <header className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              CasaX account
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {record.property.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {record.unit.name} / {record.property.address},{" "}
              {record.property.city}, {record.property.state}
            </p>
          </div>
          <ApplicationStatusChip status={record.status} />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <div className="flex items-center gap-3">
            <Clock className="size-5 text-emerald-700" />
            <h2 className="font-semibold text-slate-950">
              Application timeline
            </h2>
          </div>
          <div className="mt-7 space-y-5">
            {events.map((event) => (
              <div className="flex gap-4" key={event.id}>
                <div className="mt-1 size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <p className="text-sm font-semibold text-slate-900">
                      {statusLabel(event.toStatus)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(event.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {event.note ??
                      "CasaX will update this application as inspection and review steps progress."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="border-slate-200 bg-white shadow-sm shadow-slate-200/50">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-emerald-700" />
              <h2 className="font-semibold text-slate-950">Rental summary</h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <Detail label="Unit type" value={record.unit.unitType} />
              <Detail
                label="Annual rent"
                value={formatCurrency(record.unit.rentAmount)}
              />
              <Detail
                label="Bedrooms"
                value={`${record.unit.bedroomCount ?? 0}`}
              />
              <Detail label="Next step" value={nextStep(record.status)} />
            </dl>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50 shadow-none">
            <h2 className="font-semibold text-emerald-950">
              CasaX review notes
            </h2>
            <p className="mt-3 text-sm leading-6 text-emerald-800">
              Inspection status, document requests, and onboarding next steps
              will appear here as CasaX reviews this application.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Application submitted",
    submitted: "Application submitted",
    inspection_required: "Inspection required",
    inspection_scheduled: "Inspection scheduled",
    inspection_booked: "Inspection booked",
    under_review: "Under CasaX review",
    approved: "Application approved",
    rejected: "Application closed",
    converted_to_tenant: "Resident onboarding completed",
    converted_to_resident: "Resident onboarding completed",
  };
  return labels[status] ?? "Application update";
}

function nextStep(status: string) {
  const labels: Record<string, string> = {
    pending: "CasaX review",
    submitted: "CasaX review",
    inspection_required: "Book inspection",
    inspection_scheduled: "Attend inspection",
    inspection_booked: "Attend inspection",
    under_review: "Await review outcome",
    approved: "Resident onboarding",
    rejected: "Review closed",
    converted_to_tenant: "Resident portal",
    converted_to_resident: "Resident portal",
  };
  return labels[status] ?? "CasaX review";
}
