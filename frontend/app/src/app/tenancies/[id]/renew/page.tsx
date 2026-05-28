"use client";

import { useParams, useRouter } from "next/navigation";
import { FileText, RefreshCw } from "lucide-react";
import { Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { TenancyRenewalForm } from "@/components/operations/tenancy-renewal-form";
import { useRenewTenancy, useTenancy } from "@/features/tenancies/queries";

export default function RenewTenancyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const tenancy = useTenancy(id);
  const renewal = useRenewTenancy(id, tenancy.data?.unitId);

  if (tenancy.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }
  if (tenancy.isError || !tenancy.data) {
    return (
      <main className="p-5 lg:p-8">
        <ErrorState
          title="Unable to load tenancy renewal"
          onRetry={() => void tenancy.refetch()}
        />
      </main>
    );
  }

  const record = tenancy.data;
  const tenant = record.user.profile;
  const canRenew = record.status === "active" || record.status === "expired";

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Tenancy renewal"
        title={`Renew ${tenant ? `${tenant.firstName} ${tenant.lastName}` : record.user.email}`}
        description={`${record.property.name} / ${record.unit.name} / Continue occupancy with a new agreement period.`}
        backHref={`/tenancies/${record.id}`}
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(420px,720px)_320px]">
        <div>
          {canRenew ? (
            <TenancyRenewalForm
              error={renewal.error?.message}
              isPending={renewal.isPending}
              onSubmit={async (input) => {
                const renewed = await renewal.mutateAsync(input);
                router.push(`/tenancies/${renewed.id}`);
              }}
              tenancy={record}
            />
          ) : (
            <Card className="border-orange-100 bg-orange-50/40">
              <h2 className="font-semibold">Renewal is not available</h2>
              <p className="mt-2 text-sm text-slate-600">
                Terminated tenancy records cannot be renewed.
              </p>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card className="bg-slate-950 text-white">
            <RefreshCw className="size-6 text-emerald-400" />
            <h2 className="mt-4 font-semibold">Continued occupancy</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Renewal keeps the same tenant in the same unit while retaining
              the prior tenancy as history.
            </p>
          </Card>
          <Card>
            <FileText className="size-6 text-emerald-600" />
            <h2 className="mt-4 font-semibold">New agreement draft</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              CasaX generates a fresh agreement draft for the new lease period
              after renewal succeeds.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
