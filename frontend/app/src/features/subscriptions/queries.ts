"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BillingCycle, SubscriptionPlanType } from "@casax/types";
import {
  cancelSubscription,
  getMySubscription,
  getSubscriptionPlans,
  getSubscriptionUsage,
  initializeSubscriptionPayment,
  selectSubscriptionPlan,
} from "@/services/subscriptions";

export const subscriptionKeys = {
  plans: ["subscriptions", "plans"] as const,
  me: ["subscriptions", "me"] as const,
  usage: ["subscriptions", "usage"] as const,
};

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans,
    queryFn: getSubscriptionPlans,
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: subscriptionKeys.me,
    queryFn: getMySubscription,
  });
}

export function useSubscriptionUsage() {
  return useQuery({
    queryKey: subscriptionKeys.usage,
    queryFn: getSubscriptionUsage,
  });
}

export function useSelectSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      planType: SubscriptionPlanType;
      billingCycle: BillingCycle;
    }) => selectSubscriptionPlan(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.me });
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage });
    },
  });
}

export function useInitializeSubscriptionPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      planId?: string;
      planType?: SubscriptionPlanType;
      billingCycle: BillingCycle;
    }) => initializeSubscriptionPayment(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.me });
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.me });
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage });
    },
  });
}
