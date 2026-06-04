"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import {
  getAdminRemittances,
  updateAdminRemittance,
} from "@/services/finance";

const actions = [
  { label: "Approve", action: "approve" },
  { label: "Reject", action: "reject" },
  { label: "Retry", action: "retry" },
  { label: "Mark reconciled", action: "mark-reconciled" },
] as const;

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const remittances = useQuery({
    queryKey: ["admin", "remittances"],
    queryFn: getAdminRemittances,
  });
  const action = useMutation({
    mutationFn: ({
      id,
      nextAction,
    }: {
      id: string;
      nextAction: (typeof actions)[number]["action"];
    }) => updateAdminRemittance(id, nextAction),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  return (
    <main className="p-5 lg:p-8">
      <div>
        <p className="text-sm text-slate-500">Payment operations</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Landlord payout controls
        </h1>
      </div>

      {remittances.isLoading ? (
        <div className="mt-8 h-32 animate-pulse rounded-2xl bg-slate-100" />
      ) : null}

      {remittances.isError ? (
        <Card className="mt-8 text-sm text-orange-700">
          Unable to load payout records.
        </Card>
      ) : null}

      {remittances.data?.items.length === 0 ? (
        <Card className="mt-8 py-14 text-center">
          <Landmark className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-4 font-semibold">No payout records yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tenant payments will create landlord payout records automatically.
          </p>
        </Card>
      ) : null}

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        {remittances.data?.items.map((record) => (
          <Card key={record.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{record.property.name}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(record.netAmount)}
                </p>
                <p className="mt-2 text-xs capitalize text-slate-500">
                  {record.status} / fee {formatCurrency(record.platformFee)}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                {record.status}
              </span>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {actions.map((item) => (
                <Button
                  disabled={action.isPending}
                  key={item.action}
                  onClick={() =>
                    action.mutate({ id: record.id, nextAction: item.action })
                  }
                  variant="outline"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </section>
    </main>
  );
}
