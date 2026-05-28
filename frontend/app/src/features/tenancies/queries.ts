"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TenancyInput,
  TenancyAgreementInput,
  TenancyStatus,
  TenancyUpdateInput,
} from "@casax/types";
import { operationsKeys } from "@/features/operations/queries";
import { propertyKeys } from "@/features/properties/queries";
import {
  convertApplicationToTenancy,
  createTenancyAgreement,
  getOccupancy,
  getOccupancySummary,
  getTenancies,
  getTenancy,
  getTenancyAgreement,
  getUnitOccupancyHistory,
  markTenancyAgreementSigned,
  sendTenancyAgreement,
  renewTenancy,
  terminateTenancy,
  updateTenancyAgreement,
  updateTenancy,
} from "@/services/tenancies";

export const tenancyKeys = {
  all: ["tenancies"] as const,
  list: (status: string) => ["tenancies", "list", status] as const,
  detail: (id: string) => ["tenancies", "detail", id] as const,
  agreement: (id: string) => ["tenancies", "agreement", id] as const,
  occupancy: ["occupancy"] as const,
  unitHistory: (unitId: string) => ["occupancy", "unit", unitId] as const,
  summary: ["dashboard", "occupancy-summary"] as const,
};

export function useTenancies(status: TenancyStatus | "") {
  return useQuery({
    queryKey: tenancyKeys.list(status),
    queryFn: () => getTenancies(status),
  });
}

export function useTenancy(id: string) {
  return useQuery({
    queryKey: tenancyKeys.detail(id),
    queryFn: () => getTenancy(id),
    enabled: Boolean(id),
  });
}

export function useTenancyAgreement(id: string) {
  return useQuery({
    queryKey: tenancyKeys.agreement(id),
    queryFn: () => getTenancyAgreement(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useOccupancy() {
  return useQuery({ queryKey: tenancyKeys.occupancy, queryFn: getOccupancy });
}

export function useUnitOccupancyHistory(unitId: string) {
  return useQuery({
    queryKey: tenancyKeys.unitHistory(unitId),
    queryFn: () => getUnitOccupancyHistory(unitId),
    enabled: Boolean(unitId),
  });
}

export function useOccupancySummary() {
  return useQuery({
    queryKey: tenancyKeys.summary,
    queryFn: getOccupancySummary,
  });
}

export function useConvertApplication(
  applicationId: string,
  propertyId?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenancyInput) =>
      convertApplicationToTenancy(applicationId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.application(applicationId),
      });
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.applications,
      });
      await queryClient.invalidateQueries({ queryKey: operationsKeys.summary });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.all });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.occupancy });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.summary });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
      if (propertyId) {
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.detail(propertyId),
        });
      }
    },
  });
}

export function useUpdateTenancy(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenancyUpdateInput) => updateTenancy(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.all });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.summary });
    },
  });
}

export function useTerminateTenancy(
  id: string,
  unitId?: string,
  propertyId?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => terminateTenancy(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.all });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.occupancy });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.summary });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      if (unitId) {
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.unit(unitId),
        });
        await queryClient.invalidateQueries({
          queryKey: tenancyKeys.unitHistory(unitId),
        });
      }
      if (propertyId) {
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.detail(propertyId),
        });
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.units(propertyId),
        });
      }
    },
  });
}

export function useRenewTenancy(id: string, unitId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenancyInput) => renewTenancy(id, input),
    onSuccess: async (renewed) => {
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.all });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.detail(id) });
      await queryClient.invalidateQueries({
        queryKey: tenancyKeys.detail(renewed.id),
      });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.occupancy });
      await queryClient.invalidateQueries({ queryKey: tenancyKeys.summary });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
      if (unitId) {
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.unit(unitId),
        });
        await queryClient.invalidateQueries({
          queryKey: tenancyKeys.unitHistory(unitId),
        });
      }
    },
  });
}

export function useCreateTenancyAgreement(tenancyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenancyAgreementInput) =>
      createTenancyAgreement(tenancyId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tenancyKeys.agreement(tenancyId),
      });
    },
  });
}

export function useUpdateTenancyAgreement(
  tenancyId: string,
  agreementId?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenancyAgreementInput) => {
      if (!agreementId) throw new Error("Agreement record is unavailable.");
      return updateTenancyAgreement(agreementId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tenancyKeys.agreement(tenancyId),
      });
    },
  });
}

export function useSendTenancyAgreement(
  tenancyId: string,
  agreementId?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!agreementId) throw new Error("Agreement record is unavailable.");
      return sendTenancyAgreement(agreementId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tenancyKeys.agreement(tenancyId),
      });
    },
  });
}

export function useMarkAgreementSigned(
  tenancyId: string,
  agreementId?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!agreementId) throw new Error("Agreement record is unavailable.");
      return markTenancyAgreementSigned(agreementId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tenancyKeys.agreement(tenancyId),
      });
    },
  });
}
