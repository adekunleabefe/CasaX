"use client";

import Link from "next/link";
import { ArrowRight, Building2, UsersRound } from "lucide-react";
import { Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { StatusBadge } from "@/components/operations/status-badge";
import { useOccupancy } from "@/features/tenancies/queries";

export default function OccupancyPage() {
  const occupancy = useOccupancy();

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Occupancy"
        title="Who occupies each unit"
        description="Current and historical occupant records created from approved tenancy conversions."
      />
      <section className="mt-8">
        {occupancy.isLoading ? <LoadingCards /> : null}
        {occupancy.isError ? (
          <ErrorState
            title="Unable to load occupancy records"
            onRetry={() => void occupancy.refetch()}
          />
        ) : null}
        {occupancy.data?.items.length === 0 ? (
          <Card className="py-14 text-center">
            <UsersRound className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">No occupancy records yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Convert an approved application to begin occupancy history.
            </p>
          </Card>
        ) : null}
        {occupancy.data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {occupancy.data.items.map((record) => {
              const profile = record.user.profile;
              return (
                <Card key={record.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">
                        {profile
                          ? `${profile.firstName} ${profile.lastName}`
                          : record.user.email}
                      </h2>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <Building2 className="size-4" />
                        {record.property.name} / {record.unit.name}
                      </p>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                  <div className="mt-6 flex gap-8 border-t border-slate-100 pt-5 text-sm">
                    <div>
                      <p className="text-slate-500">Move in</p>
                      <p className="mt-1 font-medium">
                        {new Date(record.moveInDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Move out</p>
                      <p className="mt-1 font-medium">
                        {record.moveOutDate
                          ? new Date(record.moveOutDate).toLocaleDateString()
                          : "Current occupant"}
                      </p>
                    </div>
                  </div>
                  <Link
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
                    href={`/units/${record.unit.id}/occupancy-history`}
                  >
                    View unit history <ArrowRight className="size-4" />
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
