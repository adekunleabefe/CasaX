"use client";

import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { StatusBadge } from "@/components/operations/status-badge";
import { useTenancies, useTenancyAgreement } from "@/features/tenancies/queries";

export default function AgreementPage() {
  const tenancies = useTenancies("");
  const activeTenancy = tenancies.data?.items.find(
    (tenancy) => tenancy.status === "active" || tenancy.status === "pending",
  );
  const agreement = useTenancyAgreement(activeTenancy?.id ?? "");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Agreement</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Tenancy agreement
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Review your lease document, status and tenancy period.
        </p>
      </header>

      <Card className="mt-6">
        {agreement.isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        ) : agreement.data && activeTenancy ? (
          <>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <FileText className="size-6 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-950">
                  {agreement.data.title}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {agreement.data.agreementNumber} / {activeTenancy.property.name}
                </p>
              </div>
              <StatusBadge status={agreement.data.status} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Detail label="Lease starts" value={formatDate(activeTenancy.startDate)} />
              <Detail label="Lease ends" value={formatDate(activeTenancy.endDate)} />
              <Detail label="Last updated" value={formatDate(agreement.data.updatedAt)} />
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {agreement.data.content}
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={`/tenancies/${activeTenancy.id}#agreement`}>
                  View agreement
                </Link>
              </Button>
              <Button variant="outline">
                <Download className="mr-2 size-4" />
                Download PDF
              </Button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <FileText className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold text-slate-950">
              Your tenancy agreement will appear here once issued.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              You will be notified when your agreement is ready.
            </p>
          </div>
        )}
      </Card>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-950">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
