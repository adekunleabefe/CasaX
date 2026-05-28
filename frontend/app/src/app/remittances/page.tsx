"use client";

import Link from "next/link";
import { ArrowRight, Landmark, Plus } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useRemittances } from "@/features/finance/queries";

export default function RemittancesPage() {
  const remittances = useRemittances();

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Payment remitted"
        title="Caretaker remittance tracking"
        description="Keep collected rent distinct from funds actually transferred to the landlord."
        action={
          <Button asChild>
            <Link href="/remittances/new">
              <Plus className="mr-2 size-4" /> Record remittance
            </Link>
          </Button>
        }
      />
      <section className="mt-8">
        {remittances.isLoading ? <LoadingCards /> : null}
        {remittances.isError ? (
          <ErrorState title="Unable to load remittances" onRetry={() => void remittances.refetch()} />
        ) : null}
        {remittances.data?.items.length === 0 ? (
          <Card className="py-14 text-center">
            <Landmark className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No remittance records yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Paid caretaker collections remain pending remittance until transferred.
            </p>
          </Card>
        ) : null}
        {remittances.data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {remittances.data.items.map((record) => (
              <Card key={record.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{record.property.name}</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(record.amount)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {record.payments.length} payment record
                      {record.payments.length === 1 ? "" : "s"} /{" "}
                      {record.caretaker.user.profile
                        ? `${record.caretaker.user.profile.firstName} ${record.caretaker.user.profile.lastName}`
                        : record.caretaker.user.email}
                    </p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
                <Link
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
                  href={`/remittances/${record.id}`}
                >
                  Review remittance <ArrowRight className="size-4" />
                </Link>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
