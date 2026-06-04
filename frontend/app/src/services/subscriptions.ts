import type {
  BillingCycle,
  SubscriptionMe,
  SubscriptionPaymentInitialization,
  SubscriptionPlan,
  SubscriptionPlanType,
  SubscriptionUsage,
} from "@casax/types";
import { apiRequest } from "./api";

type WireMoney = string | number | null;

type WirePlan = Omit<
  SubscriptionPlan,
  "monthlyPrice" | "annualPrice" | "type"
> & {
  type: Uppercase<SubscriptionPlanType> | SubscriptionPlanType;
  monthlyPrice: WireMoney;
  annualPrice: WireMoney;
};

type WireSubscriptionMe = Omit<SubscriptionMe, "subscription"> & {
  subscription: Omit<SubscriptionMe["subscription"], "plan"> & {
    plan: WirePlan;
  };
};

type WireUsage = SubscriptionUsage;

type WirePaymentInitialization = Omit<
  SubscriptionPaymentInitialization,
  "payment"
> & {
  payment: Omit<SubscriptionPaymentInitialization["payment"], "amount"> & {
    amount: string | number;
  };
};

function lower<T extends string>(value: string): T {
  return value.toLowerCase() as T;
}

function money(value: WireMoney) {
  return value === null ? null : Number(value);
}

function normalizePlan(plan: WirePlan): SubscriptionPlan {
  return {
    ...plan,
    type: lower<SubscriptionPlanType>(plan.type),
    monthlyPrice: money(plan.monthlyPrice),
    annualPrice: money(plan.annualPrice),
  };
}

function normalizeSubscriptionMe(data: WireSubscriptionMe): SubscriptionMe {
  return {
    ...data,
    subscription: {
      ...data.subscription,
      status: lower(data.subscription.status),
      billingCycle: lower(data.subscription.billingCycle),
      plan: normalizePlan(data.subscription.plan),
    },
  };
}

function normalizeInitialization(
  data: WirePaymentInitialization,
): SubscriptionPaymentInitialization {
  return {
    ...data,
    payment: {
      ...data.payment,
      amount: Number(data.payment.amount),
      provider: lower(data.payment.provider),
      status: lower(data.payment.status),
      billingCycle: lower(data.payment.billingCycle),
    },
  };
}

export async function getSubscriptionPlans() {
  const plans = await apiRequest<WirePlan[]>("/subscriptions/plans");
  return plans.map(normalizePlan);
}

export async function getMySubscription() {
  const data = await apiRequest<WireSubscriptionMe>("/subscriptions/me");
  return normalizeSubscriptionMe(data);
}

export async function getSubscriptionUsage() {
  return apiRequest<WireUsage>("/subscriptions/usage");
}

export async function selectSubscriptionPlan(input: {
  planType: SubscriptionPlanType;
  billingCycle: BillingCycle;
}) {
  const data = await apiRequest<WireSubscriptionMe["subscription"]>(
    "/subscriptions/select-plan",
    {
      method: "POST",
      body: JSON.stringify({
        planType: input.planType.toUpperCase(),
        billingCycle: input.billingCycle.toUpperCase(),
      }),
    },
  );
  return {
    ...data,
    status: lower(data.status),
    billingCycle: lower(data.billingCycle),
    plan: normalizePlan(data.plan),
  };
}

export async function initializeSubscriptionPayment(input: {
  planId?: string;
  planType?: SubscriptionPlanType;
  billingCycle: BillingCycle;
}) {
  const data = await apiRequest<WirePaymentInitialization>(
    "/subscriptions/initialize-payment",
    {
      method: "POST",
      body: JSON.stringify({
        planId: input.planId,
        planType: input.planType?.toUpperCase(),
        billingCycle: input.billingCycle.toUpperCase(),
      }),
    },
  );
  return normalizeInitialization(data);
}

export async function cancelSubscription() {
  return apiRequest<WireSubscriptionMe["subscription"]>("/subscriptions/cancel", {
    method: "POST",
  });
}
