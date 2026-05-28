"use client";

import { useParams } from "next/navigation";
import { ExternalLink, Landmark, ReceiptText, UserRound } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import {
  useDeleteRemittance,
  useRemittance,
  useUpdateRemittance,
} from "@/features/finance/queries";
import { useCurrentUser } from "@/features/auth/queries";

export default function RemittanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const remittance = useRemittance(id);
  const update = useUpdateRemittance(id);
  const remove = useDeleteRemittance();
  const currentUser = useCurrentUser();

  if (remittance.isLoading) return <main className="p-5 lg:p-8"><LoadingCards /></main>;
  if (remittance.isError || !remittance.data) {
    return <main className="p-5 lg:p-8"><ErrorState title="Unable to load remittance" onRetry={() => void remittance.refetch()} /></main>;
  }
  const record = remittance.data;
  const profile = record.caretaker.user.profile;
  const canManage = currentUser.data?.role === "landlord";

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Remittance record"
        title={formatCurrency(record.amount)}
        description={`${record.property.name} / transfer from assigned caretaker`}
        backHref="/remittances"
        action={<StatusBadge status={record.status} />}
      />
      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Info icon={UserRound} label="Caretaker" value={profile ? `${profile.firstName} ${profile.lastName}` : record.caretaker.user.email} />
            <Info icon={Landmark} label="Transfer method" value={record.method.replaceAll("_", " ")} />
            <Info icon={ReceiptText} label="Reference" value={record.reference ?? "Not supplied"} />
            <Info icon={Landmark} label="Remitted at" value={record.remittedAt ? new Date(record.remittedAt).toLocaleDateString() : "Awaiting confirmation"} />
          </div>
          <h2 className="mt-8 border-t border-slate-100 pt-6 font-semibold">Allocated collections</h2>
          <div className="mt-4 space-y-3">
            {record.payments.map((allocation) => (
              <div className="flex justify-between rounded-xl bg-slate-50 p-4 text-sm" key={allocation.id}>
                <div>
                  <p className="font-medium">
                    {allocation.rentPayment.unit.name} / {allocation.rentPayment.property.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Payment received {new Date(allocation.rentPayment.paidAt ?? allocation.rentPayment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(allocation.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Transfer evidence</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Confirm transfer status only after evidence has been reviewed.
          </p>
          {record.proofUrl ? (
            <a className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-700" href={record.proofUrl} rel="noreferrer" target="_blank">
              Open proof <ExternalLink className="size-4" />
            </a>
          ) : (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No transfer proof attached.</p>
          )}
          {canManage && record.status !== "remitted" && record.status !== "cancelled" ? (
            <Button className="mt-6 w-full" disabled={update.isPending} onClick={() => void update.mutateAsync({ status: "remitted" })}>
              Confirm remitted
            </Button>
          ) : null}
          {canManage && record.status !== "cancelled" ? (
            <Button className="mt-3 w-full border-orange-200 text-orange-700 hover:bg-orange-50" disabled={remove.isPending} onClick={() => void remove.mutateAsync(id)} variant="outline">
              Cancel remittance
            </Button>
          ) : null}
          {(update.error || remove.error) ? <p className="mt-4 text-sm text-orange-700">{(update.error ?? remove.error)?.message}</p> : null}
        </Card>
      </div>
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Landmark; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 text-emerald-600" />
      <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-sm font-medium capitalize">{value}</p></div>
    </div>
  );
}
