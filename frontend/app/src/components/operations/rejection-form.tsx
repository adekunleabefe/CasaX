"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@casax/ui";
import { rejectionSchema } from "@/features/operations/schemas";

type RejectionValues = z.infer<typeof rejectionSchema>;

export function RejectionForm({
  isPending,
  onReject,
}: {
  isPending: boolean;
  onReject: (reason?: string) => Promise<void>;
}) {
  const form = useForm<RejectionValues>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { reason: "" },
  });

  async function submit(values: RejectionValues) {
    await onReject(values.reason);
  }

  return (
    <form className="mt-5 space-y-3" onSubmit={form.handleSubmit(submit)}>
      <textarea
        className="min-h-24 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        placeholder="Optional reason for rejection"
        {...form.register("reason")}
      />
      <Button
        className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
        disabled={isPending}
        type="submit"
        variant="outline"
      >
        {isPending ? "Rejecting..." : "Reject application"}
      </Button>
    </form>
  );
}
