"use client";

import { useParams } from "next/navigation";
import { Landmark, ReceiptText } from "lucide-react";
import { Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useLandlordRemittance } from "@/features/finance/queries";

export default function RemittanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const remittance = useLandlordRemittance(id);

  if (remittance.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }

  if (remittance.isError || !remittance.data) {
    return (
      <main className="p-5 lg:p-8">
        <ErrorState
          title="Unable to load payout"
          onRetry={() => void remittance.refetch()}
        />
      </main>
    );
  }

  const record = remittance.data;
  const source = record.rentPayment ?? record.leaseRenewalPayment;

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX payout"
        title={formatCurrency(record.netAmount)}
        description={`${record.property.name} / landlord payout record`}
        backHref="/remittances"
        action={<StatusBadge status={record.status} />}
      />

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Info
              icon={Landmark}
              label="Gross rent"
              value={formatCurrency(record.grossAmount)}
            />
            <Info
              icon={ReceiptText}
              label="Adjustments"
              value={formatCurrency(record.platformFee)}
            />
            <Info
              icon={Landmark}
              label="Net payout"
              value={formatCurrency(record.netAmount)}
            />
            <Info
              icon={ReceiptText}
              label="Paid at"
              value={
                record.paidAt
                  ? new Date(record.paidAt).toLocaleDateString()
                  : "Awaiting payout"
              }
            />
          </div>

          <h2 className="mt-8 border-t border-slate-100 pt-6 font-semibold">
            Source payment
          </h2>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-medium">
              {record.rentPayment ? "Rent payment" : "Lease renewal payment"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {source
                ? `Collected ${formatCurrency(source.amount)}`
                : "Payment source unavailable"}
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Payout status</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            CasaX reviews collected funds and remits the net payout to the
            landlord.
          </p>
          <div className="mt-5">
            <StatusBadge status={record.status} />
          </div>
        </Card>
      </div>
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Landmark;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 text-emerald-600" />
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}
