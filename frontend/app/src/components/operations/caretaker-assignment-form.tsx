"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card } from "@casax/ui";
import { caretakerAssignmentSchema } from "@/features/operations/schemas";

type AssignmentValues = z.infer<typeof caretakerAssignmentSchema>;

export function CaretakerAssignmentForm({
  isPending,
  error,
  onSubmit,
}: {
  isPending: boolean;
  error?: string;
  onSubmit: (email: string) => Promise<void>;
}) {
  const form = useForm<AssignmentValues>({
    resolver: zodResolver(caretakerAssignmentSchema),
    defaultValues: { caretakerEmail: "" },
  });

  async function submit(values: AssignmentValues) {
    try {
      await onSubmit(values.caretakerEmail);
      form.reset();
    } catch {
      // API error is displayed beneath the field.
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50">
          <UserPlus className="size-5 text-emerald-700" />
        </div>
        <div>
          <h2 className="font-semibold">Assign caretaker</h2>
          <p className="text-sm text-slate-500">
            Assign an existing verified caretaker account.
          </p>
        </div>
      </div>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(submit)}>
        <label className="block text-sm font-medium text-slate-700">
          Caretaker email
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="caretaker@casax.ng"
            {...form.register("caretakerEmail")}
          />
        </label>
        {form.formState.errors.caretakerEmail ? (
          <p className="text-xs font-medium text-orange-700">
            {form.formState.errors.caretakerEmail.message}
          </p>
        ) : null}
        {error ? <p className="text-sm text-orange-700">{error}</p> : null}
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Assigning..." : "Assign caretaker"}
        </Button>
      </form>
    </Card>
  );
}
