"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TenantOnboardingInput } from "@casax/types";
import { operationsKeys } from "@/features/operations/queries";
import { propertyKeys } from "@/features/properties/queries";
import { tenancyKeys } from "@/features/tenancies/queries";
import {
  approveTenantOnboardingRequest,
  createDirectTenant,
  createTenantOnboardingRequest,
  getTenantOnboardingRequest,
  getTenantOnboardingRequests,
  rejectTenantOnboardingRequest,
} from "@/services/onboarding";

export const onboardingKeys = {
  all: ["tenant-onboarding-requests"] as const,
  detail: (id: string) => ["tenant-onboarding-requests", "detail", id] as const,
};

export function useTenantOnboardingRequests() {
  return useQuery({
    queryKey: onboardingKeys.all,
    queryFn: getTenantOnboardingRequests,
  });
}

export function useTenantOnboardingRequest(id: string) {
  return useQuery({
    queryKey: onboardingKeys.detail(id),
    queryFn: () => getTenantOnboardingRequest(id),
    enabled: Boolean(id),
  });
}

async function invalidateConversionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  unitId: string,
) {
  await queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
  await queryClient.invalidateQueries({ queryKey: propertyKeys.unit(unitId) });
  await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
  await queryClient.invalidateQueries({ queryKey: tenancyKeys.all });
  await queryClient.invalidateQueries({ queryKey: tenancyKeys.occupancy });
  await queryClient.invalidateQueries({ queryKey: tenancyKeys.summary });
  await queryClient.invalidateQueries({ queryKey: operationsKeys.summary });
}

export function useCreateTenantOnboardingRequest(unitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenantOnboardingInput) =>
      createTenantOnboardingRequest(unitId, input),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
      queryClient.setQueryData(onboardingKeys.detail(record.id), record);
    },
  });
}

export function useCreateDirectTenant(unitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenantOnboardingInput) =>
      createDirectTenant(unitId, input),
    onSuccess: async () => invalidateConversionQueries(queryClient, unitId),
  });
}

export function useTenantOnboardingDecision(id: string, unitId?: string) {
  const queryClient = useQueryClient();
  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    await queryClient.invalidateQueries({ queryKey: onboardingKeys.detail(id) });
    if (unitId) await invalidateConversionQueries(queryClient, unitId);
  }
  const approve = useMutation({
    mutationFn: () => approveTenantOnboardingRequest(id),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: (reason?: string) => rejectTenantOnboardingRequest(id, reason),
    onSuccess: invalidate,
  });
  return { approve, reject };
}
