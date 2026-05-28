"use client";

import { useParams } from "next/navigation";
import { History, UserRound } from "lucide-react";
import { Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useUnitOccupancyHistory } from "@/features/tenancies/queries";

export default function OccupancyHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const history = useUnitOccupancyHistory(id);
  const unit = history.data?.[0]?.unit;

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Occupancy history"
        title={unit?.name ?? "Unit history"}
        description="Auditable move-in and move-out history for this unit."
        backHref="/occupancy"
      />
      <section className="mt-8 max-w-3xl">
        {history.isLoading ? <LoadingCards /> : null}
        {history.isError ? (
          <ErrorState
            title="Unable to load occupancy history"
            onRetry={() => void history.refetch()}
          />
        ) : null}
        {history.data?.length === 0 ? (
          <Card className="py-14 text-center">
            <History className="mx-auto size-8 text-slate-400" />
            <p className="mt-4 font-medium">No recorded occupants</p>
          </Card>
        ) : null}
        <div className="space-y-4">
          {history.data?.map((record) => {
            const profile = record.user.profile;
            return (
              <Card className="flex gap-4" key={record.id}>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <UserRound className="size-5 text-emerald-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <p className="font-semibold">
                      {profile
                        ? `${profile.firstName} ${profile.lastName}`
                        : record.user.email}
                    </p>
                    <StatusBadge status={record.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Move in: {new Date(record.moveInDate).toLocaleDateString()}
                    {" / "}
                    Move out:{" "}
                    {record.moveOutDate
                      ? new Date(record.moveOutDate).toLocaleDateString()
                      : "Current"}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
