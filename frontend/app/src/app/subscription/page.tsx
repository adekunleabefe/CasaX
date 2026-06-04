"use client";

import { useMemo, useState } from "react";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import type { BillingCycle, SubscriptionPlan } from "@casax/types";
import {
  useInitializeSubscriptionPayment,
  useMySubscription,
  useSelectSubscriptionPlan,
  useSubscriptionPlans,
  useSubscriptionUsage,
} from "@/features/subscriptions/queries";
import { ErrorState, LoadingCards } from "@/components/operations/query-states";

const packageFeatures: Record<string, string[]> = {
  starter: [
    "Up to 3 properties",
    "Up to 20 units",
    "Vacancy listing included",
    "Rent collection included",
    "Remittance tracking included",
    "Maintenance management included",
    "CasaX operations included",
  ],
  growth: [
    "Up to 10 properties",
    "Up to 100 units",
    "Vacancy listing included",
    "Rent collection included",
    "Remittance tracking included",
    "Maintenance management included",
    "Enhanced operations support",
  ],
  enterprise: [
    "Custom property limits",
    "Custom unit limits",
    "Dedicated onboarding",
    "Dedicated support",
    "Custom integrations",
    "Vacancy listing included",
    "Rent collection included",
    "Remittance management included",
  ],
};

export default function SubscriptionPage() {
  const billingCycle: BillingCycle = "monthly";
  const [devPayment, setDevPayment] = useState<string | null>(null);
  const plans = useSubscriptionPlans();
  const subscription = useMySubscription();
  const usage = useSubscriptionUsage();
  const selectPlan = useSelectSubscriptionPlan();
  const initialize = useInitializeSubscriptionPayment();

  const sortedPlans = useMemo(
    () =>
      [...(plans.data ?? [])].sort((left, right) => {
        const order = { starter: 1, growth: 2, enterprise: 3 };
        return order[left.type] - order[right.type];
      }),
    [plans.data],
  );

  async function handlePlan(plan: SubscriptionPlan) {
    if (plan.type === "enterprise") return;
    await selectPlan.mutateAsync({ planType: plan.type, billingCycle });
    const result = await initialize.mutateAsync({
      planId: plan.id,
      billingCycle,
    });
    if (result.authorizationUrl) {
      window.location.assign(result.authorizationUrl);
      return;
    }
    if (result.devMode) {
      setDevPayment(result.reference);
    }
  }

  if (plans.isLoading || subscription.isLoading || usage.isLoading) {
    return (
      <main className="mx-auto max-w-7xl p-5 lg:p-8">
        <LoadingCards />
      </main>
    );
  }

  if (plans.isError || subscription.isError || usage.isError) {
    return (
      <main className="mx-auto max-w-7xl p-5 lg:p-8">
        <ErrorState
          title="Package details could not be loaded"
          onRetry={() => {
            void plans.refetch();
            void subscription.refetch();
            void usage.refetch();
          }}
        />
      </main>
    );
  }

  const current = subscription.data?.subscription;
  const access = subscription.data?.access;

  return (
    <main className="mx-auto max-w-7xl p-5 lg:p-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Management package
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Management package
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            View your CasaX management package, portfolio limits, and service
            coverage.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          Monthly packages
        </div>
      </header>

      <Card className="mt-8 border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Current package
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {current?.plan.name} / {current?.status.replace("_", " ")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {access?.trialActive
                ? `${access.trialDaysRemaining} trial days remaining.`
                : access?.readOnly
                  ? "Your workspace is read-only until your management package is active."
                  : "Your management package is active for CasaX operations."}
            </p>
          </div>
          <ShieldCheck className="size-10 text-emerald-700" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <UsageTile
            label="Properties"
            value={`${usage.data?.propertiesUsed ?? 0} / ${formatLimit(
              usage.data?.limits.maxProperties,
            )}`}
          />
          <UsageTile
            label="Units"
            value={`${usage.data?.unitsUsed ?? 0} / ${formatLimit(
              usage.data?.limits.maxUnits,
            )}`}
          />
          <UsageTile
            label="Vacancy listing"
            value={
              usage.data?.limits.includesVacancyListing
                ? "Included"
                : "Not included"
            }
          />
        </div>
      </Card>

      {devPayment ? (
        <Card className="mt-6 border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">
            Development checkout initialized
          </p>
          <p className="mt-2 text-sm text-emerald-800">
            Reference: {devPayment}. Add Paystack keys to redirect to a real
            checkout.
          </p>
        </Card>
      ) : null}

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {sortedPlans.map((plan) => {
          const price = plan.monthlyPrice;
          const isCurrent = current?.plan.type === plan.type;
          const isEnterprise = plan.type === "enterprise";
          return (
            <Card
              className={`flex flex-col border-slate-200 p-6 shadow-sm shadow-slate-200/60 ${
                plan.type === "growth" ? "bg-slate-950 text-white" : "bg-white"
              }`}
              key={plan.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={`text-sm font-medium ${
                      plan.type === "growth" ? "text-emerald-300" : "text-emerald-700"
                    }`}
                  >
                    {plan.name}
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight">
                    {price === null
                      ? "Custom"
                      : `${formatCurrency(price)}/month`}
                  </h3>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                    Current
                  </span>
                ) : null}
              </div>
              <p
                className={`mt-4 text-sm leading-6 ${
                  plan.type === "growth" ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {plan.description}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {(packageFeatures[plan.type] ?? []).map((feature) => (
                  <li className="flex gap-3" key={feature}>
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {isEnterprise ? (
                <Button
                  asChild
                  className="mt-8 w-full"
                  variant={plan.type === "growth" ? "secondary" : "primary"}
                >
                  <a href="mailto:sales@casax.ng">Contact sales</a>
                </Button>
              ) : (
                <Button
                  className={`mt-8 w-full ${
                    plan.type === "growth"
                      ? "bg-white text-slate-950 hover:bg-slate-100"
                      : ""
                  }`}
                  disabled={initialize.isPending || selectPlan.isPending}
                  onClick={() => void handlePlan(plan)}
                >
                  {isCurrent ? "Renew package" : "Choose package"}
                  <CreditCard className="ml-2 size-4" />
                </Button>
              )}
            </Card>
          );
        })}
      </section>
    </main>
  );
}

function UsageTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatLimit(value?: number | null) {
  return value === null || value === undefined ? "unlimited" : String(value);
}
