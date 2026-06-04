"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelInspectionBooking,
  createInspectionBooking,
  getInspectionBookings,
  getSavedRentals,
  removeSavedRental,
  saveRental,
} from "@/lib/applicant";
import {
  createApplication,
  getApplication,
  getApplications,
} from "@/lib/applications";
import { currentUser } from "@/lib/auth";

export const accountKeys = {
  me: ["account", "me"] as const,
  savedRentals: ["account", "saved-rentals"] as const,
  inspections: ["account", "inspections"] as const,
  applications: ["account", "applications"] as const,
  application: (id: string) => ["account", "applications", id] as const,
};

export function useCurrentApplicant() {
  return useQuery({
    queryKey: accountKeys.me,
    queryFn: currentUser,
    retry: false,
    refetchOnMount: "always",
  });
}

export function useSavedRentals() {
  return useQuery({
    queryKey: accountKeys.savedRentals,
    queryFn: getSavedRentals,
  });
}

export function useSaveRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRental,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: accountKeys.savedRentals,
      });
    },
  });
}

export function useRemoveSavedRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeSavedRental,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: accountKeys.savedRentals,
      });
    },
  });
}

export function useInspectionBookings() {
  return useQuery({
    queryKey: accountKeys.inspections,
    queryFn: getInspectionBookings,
  });
}

export function useCreateInspectionBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInspectionBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.inspections });
      await queryClient.invalidateQueries({ queryKey: accountKeys.applications });
    },
  });
}

export function useCancelInspectionBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelInspectionBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.inspections });
    },
  });
}

export function useApplications() {
  return useQuery({
    queryKey: accountKeys.applications,
    queryFn: getApplications,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: accountKeys.application(id),
    queryFn: () => getApplication(id),
    enabled: Boolean(id),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.applications });
    },
  });
}
