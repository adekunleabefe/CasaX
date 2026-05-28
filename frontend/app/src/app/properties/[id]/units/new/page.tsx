"use client";

import { useParams, useRouter } from "next/navigation";
import type { UnitInput } from "@casax/types";
import { PageHeader } from "@/components/operations/page-header";
import { UnitForm } from "@/components/operations/unit-form";
import { useCreateUnit, useProperty } from "@/features/properties/queries";

export default function NewUnitPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const router = useRouter();
  const property = useProperty(propertyId);
  const create = useCreateUnit(propertyId);

  async function submit(values: UnitInput) {
    const unit = await create.mutateAsync(values);
    router.push(`/units/${unit.id}`);
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="New unit"
        title="Register a unit"
        description={
          property.data
            ? `Add an accountable unit record to ${property.data.name}.`
            : "Add an accountable unit record to this property."
        }
        backHref={`/properties/${propertyId}`}
      />
      <div className="mt-8">
        <UnitForm
          error={create.error?.message}
          isPending={create.isPending}
          onSubmit={submit}
          submitLabel="Create unit"
        />
      </div>
    </main>
  );
}
