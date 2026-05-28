"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentForm } from "@/components/finance/payment-form";
import { PageHeader } from "@/components/operations/page-header";
import { useCreatePayment } from "@/features/finance/queries";
import type { RentPaymentInput } from "@casax/types";

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<main className="p-5 lg:p-8">Loading payment form...</main>}>
      <NewPaymentContent />
    </Suspense>
  );
}

function NewPaymentContent() {
  const params = useSearchParams();
  const router = useRouter();
  const create = useCreatePayment();

  async function submit(input: RentPaymentInput) {
    const payment = await create.mutateAsync(input);
    router.push(`/payments/${payment.id}`);
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Payments received"
        title="Record rent payment"
        description="Create a manual, auditable receipt tied to a real tenancy and payer."
        backHref="/payments"
      />
      <div className="mt-8 max-w-4xl">
        <PaymentForm
          tenancyId={params.get("tenancyId") ?? undefined}
          error={create.error?.message}
          isPending={create.isPending}
          onSubmit={submit}
        />
      </div>
    </main>
  );
}
