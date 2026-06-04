import type {
  AdminRemittanceSummary,
  LandlordRemittance,
  LandlordRemittanceList,
} from "@casax/types";
import { apiRequest } from "./api";

type WireStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "OVERDUE"
  | "CANCELLED";
type WireProvider = "PAYSTACK" | "FLUTTERWAVE";
type WirePurpose = "RENT" | "RENEWAL";

type WireSummary = Omit<AdminRemittanceSummary, "recentPayments"> & {
  recentPayments: {
    id: string;
    reference: string;
    tenantId: string;
    propertyId: string;
    tenancyId: string;
    amount: string | number;
    currency: string;
    status: WireStatus;
    provider: WireProvider;
    purpose: WirePurpose;
    createdAt: string;
    updatedAt: string;
  }[];
};

export async function getAdminRemittanceSummary() {
  const result = await apiRequest<WireSummary>(
    "/payments/admin/remittances-summary",
  );
  return {
    ...result,
    recentPayments: result.recentPayments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      status: payment.status.toLowerCase() as Lowercase<WireStatus>,
      provider: payment.provider.toLowerCase() as Lowercase<WireProvider>,
      purpose: payment.purpose.toLowerCase() as Lowercase<WirePurpose>,
    })),
  } satisfies AdminRemittanceSummary;
}

export async function getAdminRemittances(): Promise<LandlordRemittanceList> {
  const result = await apiRequest<{
    items: (Omit<
      LandlordRemittance,
      "grossAmount" | "platformFee" | "netAmount" | "status"
    > & {
      grossAmount: string | number;
      platformFee: string | number;
      netAmount: string | number;
      status:
        | "PENDING"
        | "APPROVED"
        | "PROCESSING"
        | "PAID"
        | "FAILED"
        | "REJECTED";
    })[];
  }>("/payments/admin/remittances");

  return {
    items: result.items.map((item) => ({
      ...item,
      grossAmount: Number(item.grossAmount),
      platformFee: Number(item.platformFee),
      netAmount: Number(item.netAmount),
      status: item.status.toLowerCase() as LandlordRemittance["status"],
    })),
  };
}

export function updateAdminRemittance(
  id: string,
  action: "approve" | "reject" | "retry" | "mark-reconciled",
) {
  return apiRequest(`/payments/admin/remittances/${id}/${action}`, {
    method: "POST",
  });
}
