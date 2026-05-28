"use client";

import { useRouter } from "next/navigation";
import { ApplicationForm } from "@/components/operations/application-form";
import { PageHeader } from "@/components/operations/page-header";
import { useCreateApplication } from "@/features/operations/queries";
import type { ApplicationInput } from "@casax/types";

export default function NewApplicationPage() {
  const router = useRouter();
  const create = useCreateApplication();

  async function submit(values: ApplicationInput) {
    const application = await create.mutateAsync(values);
    router.push(`/applications/${application.id}`);
  }

  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="New application"
        title="Submit an applicant"
        description="Landlords and assigned caretakers can register a prospect against a vacant unit."
        backHref="/applications"
      />
      <div className="mt-8 max-w-4xl">
        <ApplicationForm
          error={create.error?.message}
          isPending={create.isPending}
          onSubmit={submit}
        />
      </div>
    </main>
  );
}
