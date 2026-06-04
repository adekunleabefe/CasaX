"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { getAdminResident } from "@/services/operations";

export default function AdminResidentDetailPage() {
  const params = useParams<{ id: string }>();
  const resident = useQuery({
    queryKey: ["admin", "resident", params.id],
    queryFn: () => getAdminResident(params.id),
    enabled: Boolean(params.id),
  });
  const data = resident.data;
  const residentName = data?.user.profile
    ? `${data.user.profile.firstName} ${data.user.profile.lastName}`
    : data?.user.email;

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        backHref="/residents"
        eyebrow="Resident"
        title={residentName ?? "Resident detail"}
        description="Resident tenancy, occupied unit, annual rent, agreement, and rent schedule summary."
      />
      {resident.isLoading ? <LoadingCards /> : null}
      {resident.isError ? (
        <ErrorState
          title="Unable to load resident"
          onRetry={() => void resident.refetch()}
        />
      ) : null}
      {data ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 shadow-sm">
            <h2 className="font-semibold text-slate-950">
              Residence summary
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="Resident" value={residentName ?? "-"} />
              <Detail label="Email" value={data.user.email} />
              <Detail label="Property" value={data.property.name} />
              <Detail
                label="Location"
                value={`${data.property.city}, ${data.property.state}`}
              />
              <Detail
                label="Unit"
                value={`${data.unit.name} / ${data.unit.unitType}`}
              />
              <Detail
                label="Annual rent from unit"
                value={formatCurrency(data.rentAmount)}
              />
              <Detail
                label="Lease start"
                value={new Date(data.startDate).toLocaleDateString()}
              />
              <Detail
                label="Lease end"
                value={new Date(data.endDate).toLocaleDateString()}
              />
              <Detail label="Tenancy status" value={data.status.toLowerCase()} />
              <Detail
                label="Payment frequency"
                value={data.paymentFrequency.toLowerCase()}
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <h2 className="font-semibold text-slate-950">Agreement</h2>
              <p className="mt-3 text-sm text-slate-500">
                {data.agreement
                  ? `${data.agreement.agreementNumber} / ${data.agreement.status.toLowerCase()}`
                  : "Agreement draft is not available yet."}
              </p>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <h2 className="font-semibold text-slate-950">Rent schedule</h2>
              {data.rentPayments.length ? (
                <div className="mt-4 space-y-3">
                  {data.rentPayments.map((payment) => (
                    <div
                      className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-sm"
                      key={payment.id}
                    >
                      <span>
                        <span className="block font-semibold text-slate-950">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="mt-1 block text-slate-500">
                          Due {new Date(payment.dueDate).toLocaleDateString()}
                        </span>
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-500">
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No rent schedule has been created yet.
                </p>
              )}
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <h2 className="font-semibold text-slate-950">Actions</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled variant="outline">
                  Renew Lease
                </Button>
                <Button disabled variant="outline">
                  Transfer Unit
                </Button>
                <Button disabled variant="outline">
                  Terminate Tenancy
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
