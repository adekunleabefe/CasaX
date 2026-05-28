"use client";

import { useParams } from "next/navigation";
import { Trash2, UserRound } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { CaretakerAssignmentForm } from "@/components/operations/caretaker-assignment-form";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import {
  useAssignCaretaker,
  usePropertyCaretakers,
  useRemoveCaretaker,
} from "@/features/operations/queries";
import { useProperty } from "@/features/properties/queries";

export default function PropertyCaretakersPage() {
  const { id } = useParams<{ id: string }>();
  const property = useProperty(id);
  const assignments = usePropertyCaretakers(id);
  const assign = useAssignCaretaker(id);
  const remove = useRemoveCaretaker(id);

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Caretaker assignment"
        title={property.data?.name ?? "Property caretakers"}
        description="Control who can submit applicants and support operations for this property."
        backHref={`/properties/${id}`}
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
        <CaretakerAssignmentForm
          error={assign.error?.message}
          isPending={assign.isPending}
          onSubmit={(email) => assign.mutateAsync(email).then(() => undefined)}
        />
        <section>
          <h2 className="mb-4 text-lg font-semibold">Active assignments</h2>
          {assignments.isLoading ? <LoadingCards /> : null}
          {assignments.isError ? (
            <ErrorState
              title="Unable to load assignments"
              onRetry={() => void assignments.refetch()}
            />
          ) : null}
          {assignments.data?.length === 0 ? (
            <Card className="py-12 text-center">
              <UserRound className="mx-auto size-7 text-slate-400" />
              <p className="mt-4 font-medium">No caretaker assigned yet</p>
            </Card>
          ) : null}
          {assignments.data?.length ? (
            <div className="space-y-3">
              {assignments.data.map((assignment) => {
                const profile = assignment.caretaker.user.profile;
                return (
                  <Card
                    className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                    key={assignment.id}
                  >
                    <div>
                      <p className="font-medium">
                        {profile
                          ? `${profile.firstName} ${profile.lastName}`
                          : assignment.caretaker.user.email}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {assignment.caretaker.user.email} / Assigned{" "}
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(assignment.caretakerId)}
                      variant="outline"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Remove
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
