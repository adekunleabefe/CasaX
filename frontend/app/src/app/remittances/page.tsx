"use client";

import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useLandlordRemittances } from "@/features/finance/queries";

export default function RemittancesPage() {
  const remittances = useLandlordRemittances();
  const totalPending =
    remittances.data?.items
      .filter((record) => ["pending", "approved", "processing"].includes(record.status))
      .reduce((sum, record) => sum + record.netAmount, 0) ?? 0;
  const totalPaid =
    remittances.data?.items
      .filter((record) => record.status === "paid")
      .reduce((sum, record) => sum + record.netAmount, 0) ?? 0;

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX payouts"
        title="Landlord remittance"
        description="Track collected rent and payout status from CasaX to your landlord account."
        action={
          <Button asChild variant="outline">
            <Link href="/payments">View rent collection</Link>
          </Button>
        }
      />

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Expected remittance</p>
          <p className="mt-3 text-2xl font-semibold">
            {formatCurrency(totalPending)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Paid remittance</p>
          <p className="mt-3 text-2xl font-semibold">
            {formatCurrency(totalPaid)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Payout visibility</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Each payout separates gross rent, adjustments if any, and net
            remittance.
          </p>
        </Card>
      </section>

      <section className="mt-6">
        {remittances.isLoading ? <LoadingCards /> : null}
        {remittances.isError ? (
          <ErrorState
            title="Unable to load remittances"
            onRetry={() => void remittances.refetch()}
          />
        ) : null}
        {remittances.data?.items.length === 0 ? (
          <Card className="py-14 text-center">
            <Landmark className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No payout records yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              CasaX payouts will appear here after tenant rent is collected.
            </p>
          </Card>
        ) : null}
        {remittances.data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {remittances.data.items.map((record) => (
              <Card key={record.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {record.property.name}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(record.netAmount)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Gross {formatCurrency(record.grossAmount)} / adjustment{" "}
                      {formatCurrency(record.platformFee)}
                    </p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
                <Link
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
                  href={`/remittances/${record.id}`}
                >
                  View payout <ArrowRight className="size-4" />
                </Link>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
