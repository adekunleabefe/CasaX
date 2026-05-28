"use client";

import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useTenantOnboardingRequests } from "@/features/onboarding/queries";

export default function TenantOnboardingRequestsPage() {
  const requests = useTenantOnboardingRequests();
  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Tenant onboarding"
        title="Occupancy approval queue"
        description="Review caretaker-assisted tenant submissions before tenancy begins."
      />
      <section className="mt-8">
        {requests.isLoading ? <LoadingCards /> : null}
        {requests.isError ? (
          <ErrorState
            title="Unable to load onboarding requests"
            onRetry={() => void requests.refetch()}
          />
        ) : null}
        {requests.data?.length === 0 ? (
          <Card className="py-14 text-center">
            <UserPlus className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No tenant onboarding requests</h2>
            <p className="mt-2 text-sm text-slate-500">
              Caretaker-assisted submissions will be visible here for review.
            </p>
          </Card>
        ) : null}
        {requests.data?.length ? (
          <Card className="overflow-hidden p-0">
            {requests.data.map((request) => (
              <Link
                className="grid gap-4 border-b border-slate-100 px-5 py-5 transition last:border-0 hover:bg-slate-50 lg:grid-cols-[1.15fr_1.2fr_1fr_150px_24px] lg:items-center lg:px-6"
                href={`/tenant-onboarding-requests/${request.id}`}
                key={request.id}
              >
                <div>
                  <p className="font-medium">
                    {request.firstName} {request.lastName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {request.email ?? request.phone}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">{request.property.name}</p>
                  <p className="mt-1 text-slate-500">{request.unit.name}</p>
                </div>
                <p className="text-sm text-slate-500">
                  {formatCurrency(request.rentAmount)} / {request.paymentFrequency}
                </p>
                <StatusBadge status={request.status} />
                <ArrowRight className="hidden size-4 text-slate-400 lg:block" />
              </Link>
            ))}
          </Card>
        ) : null}
      </section>
    </main>
  );
}
