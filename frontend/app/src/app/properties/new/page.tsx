"use client";

import { useRouter } from "next/navigation";
import type { PropertyInput } from "@casax/types";
import { PageHeader } from "@/components/operations/page-header";
import { PropertyForm } from "@/components/operations/property-form";
import { useCreateProperty } from "@/features/properties/queries";

export default function NewPropertyPage() {
  const router = useRouter();
  const create = useCreateProperty();

  async function submit(values: PropertyInput) {
    const property = await create.mutateAsync(values);
    router.push(`/properties/${property.id}`);
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="New property"
        title="Add a portfolio record"
        description="Create the property before registering its unit inventory."
        backHref="/properties"
      />
      <div className="mt-8">
        <PropertyForm
          error={create.error?.message}
          isPending={create.isPending}
          onSubmit={submit}
          submitLabel="Create property"
        />
      </div>
    </main>
  );
}
