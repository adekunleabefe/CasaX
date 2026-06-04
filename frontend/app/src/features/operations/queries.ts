"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApplicationInput,
  ApplicationStatus,
  ApplicationUpdateInput,
} from "@casax/types";
import {
  approveApplication,
  assignCaretaker,
  createApplication,
  getApplication,
  getApplications,
  getAvailableApplicationUnits,
  getApplicationsSummary,
  getCaretakerSummary,
  getCaretakerAssignments,
  getPropertyCaretakers,
  rejectApplication,
  removeCaretaker,
  updateApplication,
} from "@/services/operations";
import { propertyKeys } from "@/features/properties/queries";

export const operationsKeys = {
  caretakers: ["caretakers"] as const,
  propertyCaretakers: (propertyId: string) =>
    ["caretakers", "property", propertyId] as const,
  applications: ["applications"] as const,
  applicationList: (status: string) =>
    ["applications", "list", status] as const,
  application: (id: string) => ["applications", "detail", id] as const,
  summary: ["dashboard", "applications-summary"] as const,
  caretakerSummary: ["dashboard", "caretaker-summary"] as const,
  availableUnits: ["applications", "available-units"] as const,
};

export function useCaretakerAssignments() {
  return useQuery({
    queryKey: operationsKeys.caretakers,
    queryFn: getCaretakerAssignments,
  });
}

export function usePropertyCaretakers(propertyId: string) {
  return useQuery({
    queryKey: operationsKeys.propertyCaretakers(propertyId),
    queryFn: () => getPropertyCaretakers(propertyId),
    enabled: Boolean(propertyId),
  });
}

export function useAssignCaretaker(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => assignCaretaker(propertyId, email),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.caretakers,
      });
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.propertyCaretakers(propertyId),
      });
    },
  });
}

export function useRemoveCaretaker(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caretakerId: string) =>
      removeCaretaker(propertyId, caretakerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.caretakers,
      });
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.propertyCaretakers(propertyId),
      });
    },
  });
}

export function useApplications(status: ApplicationStatus | "") {
  return useQuery({
    queryKey: operationsKeys.applicationList(status),
    queryFn: () => getApplications(status),
  });
}

export function useAvailableApplicationUnits() {
  return useQuery({
    queryKey: operationsKeys.availableUnits,
    queryFn: getAvailableApplicationUnits,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: operationsKeys.application(id),
    queryFn: () => getApplication(id),
    enabled: Boolean(id),
  });
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplicationUpdateInput) => updateApplication(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.application(id),
      });
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.applications,
      });
      await queryClient.invalidateQueries({ queryKey: operationsKeys.summary });
    },
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplicationInput) => createApplication(input),
    onSuccess: async (_, input) => {
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.applications,
      });
      await queryClient.invalidateQueries({ queryKey: operationsKeys.summary });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
      await queryClient.invalidateQueries({
        queryKey: propertyKeys.detail(input.propertyId),
      });
      await queryClient.invalidateQueries({
        queryKey: operationsKeys.availableUnits,
      });
    },
  });
}

export function useApplicationDecision(id: string, propertyId?: string) {
  const queryClient = useQueryClient();
  async function invalidate() {
    await queryClient.invalidateQueries({
      queryKey: operationsKeys.applications,
    });
    await queryClient.invalidateQueries({
      queryKey: operationsKeys.application(id),
    });
    await queryClient.invalidateQueries({ queryKey: operationsKeys.summary });
    await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
    if (propertyId) {
      await queryClient.invalidateQueries({
        queryKey: propertyKeys.detail(propertyId),
      });
    }
    await queryClient.invalidateQueries({
      queryKey: operationsKeys.availableUnits,
    });
  }
  const approve = useMutation({
    mutationFn: () => approveApplication(id),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: (reason?: string) => rejectApplication(id, reason),
    onSuccess: invalidate,
  });
  return { approve, reject };
}

export function useApplicationsSummary() {
  return useQuery({
    queryKey: operationsKeys.summary,
    queryFn: getApplicationsSummary,
  });
}

export function useCaretakerSummary() {
  return useQuery({
    queryKey: operationsKeys.caretakerSummary,
    queryFn: getCaretakerSummary,
  });
}
