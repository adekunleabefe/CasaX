"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RemittanceInput, RentPaymentInput } from "@casax/types";
import {
  createPayment,
  createRemittance,
  deletePayment,
  deleteRemittance,
  getEligiblePayments,
  getPayment,
  getPayments,
  getPaymentSummary,
  getRemittance,
  getRemittances,
  getTenancyPayments,
  updatePayment,
  updateRemittance,
  type PaymentFilters,
} from "@/services/finance";

export const financeKeys = {
  payments: ["payments"] as const,
  paymentList: (filters: PaymentFilters) => ["payments", "list", filters] as const,
  payment: (id: string) => ["payments", "detail", id] as const,
  tenancyPayments: (id: string) => ["payments", "tenancy", id] as const,
  remittances: ["remittances"] as const,
  remittance: (id: string) => ["remittances", "detail", id] as const,
  eligible: ["remittances", "eligible"] as const,
  summary: ["dashboard", "payment-summary"] as const,
};

export function usePayments(filters: PaymentFilters) {
  return useQuery({
    queryKey: financeKeys.paymentList(filters),
    queryFn: () => getPayments(filters),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: financeKeys.payment(id),
    queryFn: () => getPayment(id),
    enabled: Boolean(id),
  });
}

export function useTenancyPayments(tenancyId: string) {
  return useQuery({
    queryKey: financeKeys.tenancyPayments(tenancyId),
    queryFn: () => getTenancyPayments(tenancyId),
    enabled: Boolean(tenancyId),
  });
}

export function usePaymentSummary() {
  return useQuery({ queryKey: financeKeys.summary, queryFn: getPaymentSummary });
}

export function useCreatePayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RentPaymentInput) => createPayment(input),
    onSuccess: async (payment) => {
      await client.invalidateQueries({ queryKey: financeKeys.payments });
      await client.invalidateQueries({ queryKey: financeKeys.summary });
      await client.invalidateQueries({
        queryKey: financeKeys.tenancyPayments(payment.tenancyId),
      });
      await client.invalidateQueries({ queryKey: financeKeys.eligible });
    },
  });
}

export function useUpdatePayment(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RentPaymentInput>) => updatePayment(id, input),
    onSuccess: async (payment) => {
      await client.invalidateQueries({ queryKey: financeKeys.payments });
      await client.invalidateQueries({ queryKey: financeKeys.payment(id) });
      await client.invalidateQueries({ queryKey: financeKeys.summary });
      await client.invalidateQueries({
        queryKey: financeKeys.tenancyPayments(payment.tenancyId),
      });
    },
  });
}

export function useDeletePayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deletePayment,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: financeKeys.payments });
      await client.invalidateQueries({ queryKey: financeKeys.summary });
    },
  });
}

export function useRemittances() {
  return useQuery({ queryKey: financeKeys.remittances, queryFn: getRemittances });
}

export function useRemittance(id: string) {
  return useQuery({
    queryKey: financeKeys.remittance(id),
    queryFn: () => getRemittance(id),
    enabled: Boolean(id),
  });
}

export function useEligiblePayments() {
  return useQuery({ queryKey: financeKeys.eligible, queryFn: getEligiblePayments });
}

export function useCreateRemittance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RemittanceInput) => createRemittance(input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: financeKeys.remittances });
      await client.invalidateQueries({ queryKey: financeKeys.eligible });
      await client.invalidateQueries({ queryKey: financeKeys.summary });
      await client.invalidateQueries({ queryKey: financeKeys.payments });
    },
  });
}

export function useUpdateRemittance(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RemittanceInput>) => updateRemittance(id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: financeKeys.remittances });
      await client.invalidateQueries({ queryKey: financeKeys.remittance(id) });
      await client.invalidateQueries({ queryKey: financeKeys.summary });
    },
  });
}

export function useDeleteRemittance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteRemittance,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: financeKeys.remittances });
      await client.invalidateQueries({ queryKey: financeKeys.eligible });
      await client.invalidateQueries({ queryKey: financeKeys.summary });
    },
  });
}
