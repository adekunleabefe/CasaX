import type {
  EligibleRentPayment,
  LandlordRemittance,
  LandlordRemittanceList,
  LandlordRemittanceStatus,
  LeaseRenewalPayment,
  PaymentMethod,
  PaymentInitialization,
  PaymentHistory,
  PaymentProvider,
  PaymentPurpose,
  PaymentTransaction,
  Receipt,
  PaymentStatus,
  PaymentSummary,
  RemittanceInput,
  RemittanceList,
  RemittanceRecord,
  RemittanceStatus,
  RentPayment,
  RentPaymentInput,
  RentPaymentList,
  TenantRentRenewalOverview,
  TenancyStatus,
  PaymentFrequency,
} from "@casax/types";
import { apiRequest } from "./api";

type WirePaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "OVERDUE"
  | "FAILED"
  | "CANCELLED";
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
type WireProvider = "PAYSTACK" | "FLUTTERWAVE";
type WirePurpose = "RENT" | "RENEWAL";
type WireLandlordRemittanceStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REJECTED";

type WirePayment = Omit<RentPayment, "amount" | "status" | "method" | "tenancy"> & {
  amount: string | number;
  status: WirePaymentStatus;
  method: WirePaymentMethod;
  tenancy: Omit<RentPayment["tenancy"], "status" | "paymentFrequency"> & {
    status: WireTenancyStatus;
    paymentFrequency: WireFrequency;
  };
};
type WireReceipt = Omit<Receipt, "amount" | "purpose"> & {
  amount: string | number;
  purpose: WirePurpose;
};
type WireRenewalPayment = Omit<LeaseRenewalPayment, "amount" | "status" | "tenancy" | "receipts"> & {
  amount: string | number;
  status: WirePaymentStatus;
  tenancy?: LeaseRenewalPayment["tenancy"] extends infer T
    ? Omit<NonNullable<T>, "status" | "paymentFrequency" | "rentAmount"> & {
        rentAmount: string | number;
        status: WireTenancyStatus;
        paymentFrequency: WireFrequency;
      }
    : never;
  receipts?: WireReceipt[];
};
type WireTransaction = Omit<
  PaymentTransaction,
  "amount" | "status" | "provider" | "purpose"
> & {
  amount: string | number;
  status: WirePaymentStatus;
  provider: WireProvider;
  purpose: WirePurpose;
};
type WireLandlordRemittance = Omit<
  LandlordRemittance,
  "grossAmount" | "platformFee" | "netAmount" | "status" | "rentPayment" | "leaseRenewalPayment"
> & {
  grossAmount: string | number;
  platformFee: string | number;
  netAmount: string | number;
  status: WireLandlordRemittanceStatus;
  rentPayment?: WirePayment | null;
  leaseRenewalPayment?: WireRenewalPayment | null;
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
  PROCESSING: "processing",
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
const providers: Record<WireProvider, PaymentProvider> = {
  PAYSTACK: "paystack",
  FLUTTERWAVE: "flutterwave",
};
const purposes: Record<WirePurpose, PaymentPurpose> = {
  RENT: "rent",
  RENEWAL: "renewal",
};
const landlordRemittanceStatuses: Record<
  WireLandlordRemittanceStatus,
  LandlordRemittanceStatus
> = {
  PENDING: "pending",
  APPROVED: "approved",
  PROCESSING: "processing",
  PAID: "paid",
  FAILED: "failed",
  REJECTED: "rejected",
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

function normalizeReceipt(receipt: WireReceipt): Receipt {
  return {
    ...receipt,
    amount: Number(receipt.amount),
    purpose: purposes[receipt.purpose],
  };
}

function normalizeRenewal(payment: WireRenewalPayment): LeaseRenewalPayment {
  return {
    ...payment,
    amount: Number(payment.amount),
    status: paymentStatuses[payment.status],
    tenancy: payment.tenancy
      ? {
          ...payment.tenancy,
          rentAmount: Number(payment.tenancy.rentAmount),
          status: tenancyStatuses[payment.tenancy.status],
          paymentFrequency: frequencies[payment.tenancy.paymentFrequency],
        }
      : undefined,
    receipts: payment.receipts?.map(normalizeReceipt),
  };
}

function normalizeTransaction(transaction: WireTransaction): PaymentTransaction {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    status: paymentStatuses[transaction.status],
    provider: providers[transaction.provider],
    purpose: purposes[transaction.purpose],
  };
}

function normalizeLandlordRemittance(
  remittance: WireLandlordRemittance,
): LandlordRemittance {
  return {
    ...remittance,
    grossAmount: Number(remittance.grossAmount),
    platformFee: Number(remittance.platformFee),
    netAmount: Number(remittance.netAmount),
    status: landlordRemittanceStatuses[remittance.status],
    rentPayment: remittance.rentPayment
      ? normalizePayment(remittance.rentPayment)
      : null,
    leaseRenewalPayment: remittance.leaseRenewalPayment
      ? normalizeRenewal(remittance.leaseRenewalPayment)
      : null,
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

export async function getMyRentPayments(): Promise<RentPayment[]> {
  const result = await apiRequest<WirePayment[]>("/payments/my-rent");
  return result.map(normalizePayment);
}

export async function getMyRentRenewal(): Promise<TenantRentRenewalOverview> {
  const result = await apiRequest<
    Omit<
      TenantRentRenewalOverview,
      "rentPayments" | "renewalPayments" | "receipts" | "currentRent"
    > & {
      rentPayments: WirePayment[];
      renewalPayments: WireRenewalPayment[];
      receipts: WireReceipt[];
      currentRent?: string | number | null;
    }
  >("/payments/my-rent-renewal");

  return {
    ...result,
    currentRent:
      result.currentRent === null || result.currentRent === undefined
        ? result.currentRent
        : Number(result.currentRent),
    rentPayments: result.rentPayments.map(normalizePayment),
    renewalPayments: result.renewalPayments.map(normalizeRenewal),
    receipts: result.receipts.map(normalizeReceipt),
  };
}

export async function getPaymentHistory(): Promise<PaymentHistory> {
  const result = await apiRequest<{
    transactions: WireTransaction[];
    receipts: WireReceipt[];
  }>("/payments/history");
  return {
    transactions: result.transactions.map(normalizeTransaction),
    receipts: result.receipts.map(normalizeReceipt),
  };
}

export async function getPayment(id: string) {
  return normalizePayment(await apiRequest<WirePayment>(`/payments/${id}`));
}

export async function initializePayment(
  id: string,
): Promise<PaymentInitialization> {
  const result = await apiRequest<
    Omit<PaymentInitialization, "provider"> & {
      provider: "PAYSTACK" | "FLUTTERWAVE";
    }
  >(`/payments/${id}/initialize`, { method: "POST" });

  return {
    ...result,
    provider: result.provider === "PAYSTACK" ? "paystack" : "flutterwave",
  };
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

export async function getLandlordRemittances(): Promise<LandlordRemittanceList> {
  const result = await apiRequest<{ items: WireLandlordRemittance[] }>(
    "/payments/landlord-remittances",
  );
  return { items: result.items.map(normalizeLandlordRemittance) };
}

export async function getLandlordRemittance(
  id: string,
): Promise<LandlordRemittance> {
  return normalizeLandlordRemittance(
    await apiRequest<WireLandlordRemittance>(
      `/payments/landlord-remittances/${id}`,
    ),
  );
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
