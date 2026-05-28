import type {
  EligibleRentPayment,
  PaymentMethod,
  PaymentStatus,
  PaymentSummary,
  RemittanceInput,
  RemittanceList,
  RemittanceRecord,
  RemittanceStatus,
  RentPayment,
  RentPaymentInput,
  RentPaymentList,
  TenancyStatus,
  PaymentFrequency,
} from "@casax/types";
import { apiRequest } from "./api";

type WirePaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "FAILED" | "CANCELLED";
type WirePaymentMethod =
  | "BANK_TRANSFER"
  | "CASH"
  | "POS"
  | "CARD"
  | "ONLINE_GATEWAY";
type WireRemittanceStatus =
  | "PENDING"
  | "PARTIALLY_REMITTED"
  | "REMITTED"
  | "DISPUTED"
  | "CANCELLED";
type WireTenancyStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "TERMINATED";
type WireFrequency = "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "YEARLY";

type WirePayment = Omit<RentPayment, "amount" | "status" | "method" | "tenancy"> & {
  amount: string | number;
  status: WirePaymentStatus;
  method: WirePaymentMethod;
  tenancy: Omit<RentPayment["tenancy"], "status" | "paymentFrequency"> & {
    status: WireTenancyStatus;
    paymentFrequency: WireFrequency;
  };
};
type WireRemittance = Omit<RemittanceRecord, "amount" | "status" | "method" | "payments"> & {
  amount: string | number;
  status: WireRemittanceStatus;
  method: WirePaymentMethod;
  payments: {
    id: string;
    amount: string | number;
    rentPayment: WirePayment;
  }[];
};
type WireEligible = WirePayment & { unremittedAmount: string | number };

const paymentStatuses: Record<WirePaymentStatus, PaymentStatus> = {
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  FAILED: "failed",
  CANCELLED: "cancelled",
};
const methods: Record<WirePaymentMethod, PaymentMethod> = {
  BANK_TRANSFER: "bank_transfer",
  CASH: "cash",
  POS: "pos",
  CARD: "card",
  ONLINE_GATEWAY: "online_gateway",
};
const remittanceStatuses: Record<WireRemittanceStatus, RemittanceStatus> = {
  PENDING: "pending",
  PARTIALLY_REMITTED: "partially_remitted",
  REMITTED: "remitted",
  DISPUTED: "disputed",
  CANCELLED: "cancelled",
};
const tenancyStatuses: Record<WireTenancyStatus, TenancyStatus> = {
  PENDING: "pending",
  ACTIVE: "active",
  EXPIRED: "expired",
  TERMINATED: "terminated",
};
const frequencies: Record<WireFrequency, PaymentFrequency> = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  BIANNUAL: "biannual",
  YEARLY: "yearly",
};

function normalizePayment(payment: WirePayment): RentPayment {
  return {
    ...payment,
    amount: Number(payment.amount),
    status: paymentStatuses[payment.status],
    method: methods[payment.method],
    tenancy: {
      ...payment.tenancy,
      status: tenancyStatuses[payment.tenancy.status],
      paymentFrequency: frequencies[payment.tenancy.paymentFrequency],
    },
  };
}

function normalizeRemittance(record: WireRemittance): RemittanceRecord {
  return {
    ...record,
    amount: Number(record.amount),
    status: remittanceStatuses[record.status],
    method: methods[record.method],
    payments: record.payments.map((allocation) => ({
      ...allocation,
      amount: Number(allocation.amount),
      rentPayment: normalizePayment(allocation.rentPayment),
    })),
  };
}

export interface PaymentFilters {
  status?: PaymentStatus | "";
  propertyId?: string;
  dueBefore?: string;
  caretakerCollected?: boolean;
}

export async function getPayments(filters: PaymentFilters = {}): Promise<RentPaymentList> {
  const query = new URLSearchParams({ page: "1", limit: "30" });
  if (filters.status) query.set("status", filters.status);
  if (filters.propertyId) query.set("propertyId", filters.propertyId);
  if (filters.dueBefore) query.set("dueBefore", filters.dueBefore);
  if (filters.caretakerCollected !== undefined) {
    query.set("caretakerCollected", String(filters.caretakerCollected));
  }
  const result = await apiRequest<{ items: WirePayment[]; pagination: RentPaymentList["pagination"] }>(
    `/payments?${query.toString()}`,
  );
  return { ...result, items: result.items.map(normalizePayment) };
}

export async function getPayment(id: string) {
  return normalizePayment(await apiRequest<WirePayment>(`/payments/${id}`));
}

export async function createPayment(input: RentPaymentInput) {
  return normalizePayment(
    await apiRequest<WirePayment>("/payments", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function updatePayment(id: string, input: Partial<RentPaymentInput>) {
  return normalizePayment(
    await apiRequest<WirePayment>(`/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function deletePayment(id: string) {
  await apiRequest<null>(`/payments/${id}`, { method: "DELETE" });
}

export async function getTenancyPayments(tenancyId: string): Promise<RentPayment[]> {
  const result = await apiRequest<WirePayment[]>(`/payments/tenancy/${tenancyId}`);
  return result.map(normalizePayment);
}

export async function getRemittances(): Promise<RemittanceList> {
  const result = await apiRequest<{ items: WireRemittance[]; pagination: RemittanceList["pagination"] }>(
    "/remittances?page=1&limit=30",
  );
  return { ...result, items: result.items.map(normalizeRemittance) };
}

export async function getRemittance(id: string) {
  return normalizeRemittance(
    await apiRequest<WireRemittance>(`/remittances/${id}`),
  );
}

export async function createRemittance(input: RemittanceInput) {
  return normalizeRemittance(
    await apiRequest<WireRemittance>("/remittances", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function updateRemittance(
  id: string,
  input: Partial<RemittanceInput>,
) {
  return normalizeRemittance(
    await apiRequest<WireRemittance>(`/remittances/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteRemittance(id: string) {
  await apiRequest<null>(`/remittances/${id}`, { method: "DELETE" });
}

export async function getEligiblePayments(): Promise<EligibleRentPayment[]> {
  const result = await apiRequest<WireEligible[]>("/remittances/eligible-payments");
  return result.map((payment) => ({
    ...normalizePayment(payment),
    unremittedAmount: Number(payment.unremittedAmount),
  }));
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  const result = await apiRequest<
    Omit<PaymentSummary, "recentPayments" | "recentRemittances"> & {
      recentPayments: WirePayment[];
      recentRemittances: WireRemittance[];
    }
  >("/dashboard/payment-summary");
  return {
    ...result,
    recentPayments: result.recentPayments.map(normalizePayment),
    recentRemittances: result.recentRemittances.map(normalizeRemittance),
  };
}
