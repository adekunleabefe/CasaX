"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Application, ApplicationUpdateInput } from "@casax/types";
import { Button } from "@casax/ui";
import { applicationUpdateSchema } from "@/features/operations/schemas";

type UpdateValues = z.infer<typeof applicationUpdateSchema>;

export function ApplicationUpdateForm({
  application,
  isPending,
  error,
  onSubmit,
}: {
  application: Application;
  isPending: boolean;
  error?: string;
  onSubmit: (input: ApplicationUpdateInput) => Promise<void>;
}) {
  const form = useForm<UpdateValues>({
    resolver: zodResolver(applicationUpdateSchema),
    defaultValues: {
      status:
        application.status === "inspection_booked" ||
        application.status === "under_review"
          ? application.status
          : "pending",
      notes: application.notes ?? "",
    },
  });
  const availableStatuses =
    application.status === "pending"
      ? [
          { label: "Pending", value: "pending" },
          { label: "Inspection booked", value: "inspection_booked" },
          { label: "Under review", value: "under_review" },
        ]
      : application.status === "inspection_booked"
        ? [
            { label: "Inspection booked", value: "inspection_booked" },
            { label: "Under review", value: "under_review" },
          ]
        : [{ label: "Under review", value: "under_review" }];

  return (
    <form
      className="mt-5 space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch {
          // Mutation error is rendered below.
        }
      })}
    >
      <label className="block text-sm font-medium text-slate-700">
        Workflow status
        <select
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          {...form.register("status")}
        >
          {availableStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Operational notes
        <textarea
          className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          {...form.register("notes")}
        />
      </label>
      {error ? <p className="text-sm text-orange-700">{error}</p> : null}
      <Button disabled={isPending} type="submit" variant="outline">
        {isPending ? "Saving workflow..." : "Save workflow"}
      </Button>
    </form>
  );
}
