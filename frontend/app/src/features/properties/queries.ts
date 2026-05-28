"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PropertyInput, UnitInput } from "@casax/types";
import {
  createProperty,
  createUnit,
  deleteProperty,
  deleteUnit,
  getLandlordSummary,
  getProperties,
  getProperty,
  getPropertyUnits,
  getUnit,
  updateProperty,
  updateUnit,
} from "@/services/properties";

export const propertyKeys = {
  all: ["properties"] as const,
  list: (search: string) => ["properties", "list", search] as const,
  detail: (id: string) => ["properties", "detail", id] as const,
  units: (id: string) => ["properties", id, "units"] as const,
  unit: (id: string) => ["units", "detail", id] as const,
  summary: ["dashboard", "landlord-summary"] as const,
};

export function useLandlordSummary() {
  return useQuery({
    queryKey: propertyKeys.summary,
    queryFn: getLandlordSummary,
  });
}

export function useProperties(search = "") {
  return useQuery({
    queryKey: propertyKeys.list(search),
    queryFn: () => getProperties(search),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => getProperty(id),
    enabled: Boolean(id),
  });
}

export function usePropertyUnits(propertyId: string) {
  return useQuery({
    queryKey: propertyKeys.units(propertyId),
    queryFn: () => getPropertyUnits(propertyId),
    enabled: Boolean(propertyId),
  });
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: propertyKeys.unit(id),
    queryFn: () => getUnit(id),
    enabled: Boolean(id),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PropertyInput) => createProperty(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
    },
  });
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PropertyInput) => updateProperty(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      await queryClient.invalidateQueries({
        queryKey: propertyKeys.detail(id),
      });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
    },
  });
}

export function useCreateUnit(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UnitInput) => createUnit(propertyId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: propertyKeys.detail(propertyId),
      });
      await queryClient.invalidateQueries({
        queryKey: propertyKeys.units(propertyId),
      });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
    },
  });
}

export function useUpdateUnit(id: string, propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UnitInput) => updateUnit(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: propertyKeys.unit(id) });
      if (propertyId) {
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.detail(propertyId),
        });
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.units(propertyId),
        });
      }
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
    },
  });
}

export function useDeleteUnit(propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUnit,
    onSuccess: async () => {
      if (propertyId) {
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.detail(propertyId),
        });
        await queryClient.invalidateQueries({
          queryKey: propertyKeys.units(propertyId),
        });
      }
      await queryClient.invalidateQueries({ queryKey: propertyKeys.summary });
    },
  });
}
