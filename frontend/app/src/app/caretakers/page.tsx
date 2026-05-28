"use client";

import Link from "next/link";
import { Building2, UserRound } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { useCaretakerAssignments } from "@/features/operations/queries";

export default function CaretakersPage() {
  const assignments = useCaretakerAssignments();

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Caretakers"
        title="Property accountability"
        description="Active caretaker coverage across your managed property portfolio."
        action={
          <Button asChild variant="outline">
            <Link href="/properties">Choose property to assign</Link>
          </Button>
        }
      />
      <section className="mt-8">
        {assignments.isLoading ? <LoadingCards /> : null}
        {assignments.isError ? (
          <ErrorState
            title="Unable to load caretaker assignments"
            onRetry={() => void assignments.refetch()}
          />
        ) : null}
        {assignments.data?.length === 0 ? (
          <Card className="py-14 text-center">
            <UserRound className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold">
              No active caretaker assignments
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Open a property record to assign its operational caretaker.
            </p>
          </Card>
        ) : null}
        {assignments.data?.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {assignments.data.map((assignment) => {
              const profile = assignment.caretaker.user.profile;
              return (
                <Card key={assignment.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {profile
                          ? `${profile.firstName} ${profile.lastName}`
                          : assignment.caretaker.user.email}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {assignment.caretaker.user.email}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Assigned
                    </span>
                  </div>
                  <div className="mt-6 rounded-xl bg-slate-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="size-4 text-slate-500" />
                      {assignment.property.name}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Assigned{" "}
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    className="mt-5 inline-flex text-sm font-medium text-emerald-700"
                    href={`/properties/${assignment.propertyId}/caretakers`}
                  >
                    Manage assignment
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
