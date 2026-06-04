"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelInspectionBooking,
  createInspectionBooking,
  getInspectionBookings,
  getSavedRentals,
  removeSavedRental,
  saveRental,
} from "@/services/applicant";
import { operationsKeys } from "@/features/operations/queries";

export const applicantKeys = {
  savedRentals: ["applicant", "saved-rentals"] as const,
  inspections: ["applicant", "inspections"] as const,
};

export function useSavedRentals() {
  return useQuery({
    queryKey: applicantKeys.savedRentals,
    queryFn: getSavedRentals,
  });
}

export function useSaveRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRental,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicantKeys.savedRentals,
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
        queryKey: applicantKeys.savedRentals,
      });
    },
  });
}

export function useInspectionBookings() {
  return useQuery({
    queryKey: applicantKeys.inspections,
    queryFn: getInspectionBookings,
  });
}

export function useCreateInspectionBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInspectionBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: applicantKeys.inspections });
      await queryClient.invalidateQueries({ queryKey: operationsKeys.applications });
    },
  });
}

export function useCancelInspectionBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelInspectionBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: applicantKeys.inspections });
    },
  });
}
