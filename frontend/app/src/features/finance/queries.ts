"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RemittanceInput, RentPaymentInput } from "@casax/types";
import {
  createPayment,
  createRemittance,
  deletePayment,
  deleteRemittance,
  getEligiblePayments,
  getLandlordRemittances,
  getLandlordRemittance,
  getMyRentRenewal,
  getMyRentPayments,
  getPaymentHistory,
  getPayment,
  getPayments,
  getPaymentSummary,
  initializePayment,
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
  myRent: ["payments", "my-rent"] as const,
  myRentRenewal: ["payments", "my-rent-renewal"] as const,
  history: ["payments", "history"] as const,
  tenancyPayments: (id: string) => ["payments", "tenancy", id] as const,
  remittances: ["remittances"] as const,
  landlordRemittances: ["payments", "landlord-remittances"] as const,
  landlordRemittance: (id: string) =>
    ["payments", "landlord-remittances", id] as const,
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

export function useMyRentPayments() {
  return useQuery({
    queryKey: financeKeys.myRent,
    queryFn: getMyRentPayments,
  });
}

export function useMyRentRenewal() {
  return useQuery({
    queryKey: financeKeys.myRentRenewal,
    queryFn: getMyRentRenewal,
  });
}

export function usePaymentHistory() {
  return useQuery({
    queryKey: financeKeys.history,
    queryFn: getPaymentHistory,
  });
}

export function useInitializePayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: initializePayment,
    onSuccess: async (_, paymentId) => {
      await client.invalidateQueries({ queryKey: financeKeys.myRent });
      await client.invalidateQueries({ queryKey: financeKeys.myRentRenewal });
      await client.invalidateQueries({ queryKey: financeKeys.history });
      await client.invalidateQueries({ queryKey: financeKeys.payment(paymentId) });
      await client.invalidateQueries({ queryKey: financeKeys.payments });
    },
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

export function useLandlordRemittances() {
  return useQuery({
    queryKey: financeKeys.landlordRemittances,
    queryFn: getLandlordRemittances,
  });
}

export function useLandlordRemittance(id: string) {
  return useQuery({
    queryKey: financeKeys.landlordRemittance(id),
    queryFn: () => getLandlordRemittance(id),
    enabled: Boolean(id),
  });
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
