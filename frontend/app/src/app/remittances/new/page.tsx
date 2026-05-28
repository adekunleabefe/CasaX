"use client";

import { useRouter } from "next/navigation";
import type { RemittanceInput } from "@casax/types";
import { RemittanceForm } from "@/components/finance/remittance-form";
import { PageHeader } from "@/components/operations/page-header";
import { useCreateRemittance } from "@/features/finance/queries";

export default function NewRemittancePage() {
  const router = useRouter();
  const create = useCreateRemittance();

  async function submit(input: RemittanceInput) {
    const remittance = await create.mutateAsync(input);
    router.push(`/remittances/${remittance.id}`);
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Payment remitted"
        title="Record caretaker transfer"
        description="Allocate a remittance only against received rent awaiting transfer."
        backHref="/remittances"
      />
      <div className="mt-8">
        <RemittanceForm
          error={create.error?.message}
          isPending={create.isPending}
          onSubmit={submit}
        />
      </div>
    </main>
  );
}
