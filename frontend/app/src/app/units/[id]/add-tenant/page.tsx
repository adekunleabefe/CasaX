"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";
import { TenantOnboardingForm } from "@/components/operations/tenant-onboarding-form";
import { useCurrentUser } from "@/features/auth/queries";
import {
  useCreateDirectTenant,
  useCreateTenantOnboardingRequest,
} from "@/features/onboarding/queries";
import { useUnit } from "@/features/properties/queries";

export default function AddTenantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const unit = useUnit(id);
  const isLandlord = user.data?.role === "landlord";
  const [requiresApproval, setRequiresApproval] = useState(false);
  const direct = useCreateDirectTenant(id);
  const request = useCreateTenantOnboardingRequest(id);
  const mode = isLandlord && !requiresApproval ? "direct" : "request";

  if (unit.isLoading || user.isLoading) {
    return (
      <main className="p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }
  if (unit.isError || !unit.data) {
    return (
      <main className="p-5 lg:p-8">
        <ErrorState
          title="Unable to prepare tenant onboarding"
          onRetry={() => void unit.refetch()}
        />
      </main>
    );
  }

  const record = unit.data;
  const canAdd =
    record.status === "vacant" || record.status === "pending_approval";
  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Tenant onboarding"
        title="Add tenant"
        description={`Add a new tenant or record an existing occupant for this unit. ${record.property?.name ?? "Property"} / ${record.name}.`}
        backHref={`/units/${record.id}`}
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(420px,720px)_320px]">
        <div>
          {!canAdd ? (
            <Card className="border-orange-100 bg-orange-50/40">
              <h2 className="font-semibold">Unit is not available</h2>
              <p className="mt-2 text-sm text-slate-600">
                This unit cannot accept tenant onboarding while occupied or
                inactive.
              </p>
            </Card>
          ) : (
            <TenantOnboardingForm
              error={(mode === "direct" ? direct.error : request.error)?.message}
              isPending={mode === "direct" ? direct.isPending : request.isPending}
              mode={mode}
              onSubmit={async (input) => {
                if (mode === "direct") {
                  const tenancy = await direct.mutateAsync(input);
                  const notice =
                    tenancy.invitationOutcome === "sent"
                      ? "?onboarding=invitation-sent"
                      : tenancy.invitationOutcome === "email_missing"
                        ? "?onboarding=email-missing"
                        : tenancy.invitationOutcome === "delivery_failed"
                          ? "?onboarding=delivery-failed"
                        : "";
                  router.push(`/tenancies/${tenancy.id}${notice}`);
                } else {
                  const onboarding = await request.mutateAsync(input);
                  router.push(`/tenant-onboarding-requests/${onboarding.id}`);
                }
              }}
              rentAmount={record.rentAmount}
            />
          )}
        </div>
        <div className="space-y-4">
          {isLandlord && canAdd ? (
            <Card>
              <ShieldCheck className="size-6 text-emerald-600" />
              <h2 className="mt-4 font-semibold">Approval path</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Direct onboarding creates occupancy immediately. Use approval
                mode when another verification step is appropriate.
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => setRequiresApproval((value) => !value)}
                variant="outline"
              >
                {requiresApproval ? "Use direct onboarding" : "Require approval"}
              </Button>
            </Card>
          ) : null}
          <Card className="bg-slate-950 text-white">
            <UserPlus className="size-6 text-emerald-400" />
            <h2 className="mt-4 font-semibold">
              {mode === "direct" ? "Direct occupancy" : "Approval required"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {mode === "direct"
                ? "Tenancy, occupancy, and an agreement draft are created together."
                : "A landlord must approve this submission before occupancy begins."}
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
