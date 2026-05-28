import type {
  PaymentFrequency,
  TenantOnboardingInput,
  TenantOnboardingRequest,
  TenantOnboardingStatus,
  Tenancy,
  UnitStatus,
} from "@casax/types";
import { apiRequest } from "./api";
import { normalizeTenancy, type WireTenancy } from "./tenancies";

type WireOnboardingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED_TO_TENANCY";
type WirePaymentFrequency = "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "YEARLY";
type WireUnitStatus =
  | "VACANT"
  | "OCCUPIED"
  | "PENDING_APPROVAL"
  | "MAINTENANCE"
  | "INACTIVE";
type WireRequest = Omit<
  TenantOnboardingRequest,
  "status" | "paymentFrequency" | "rentAmount" | "unit" | "tenancy"
> & {
  status: WireOnboardingStatus;
  paymentFrequency: WirePaymentFrequency;
  rentAmount: number | string;
  unit: Omit<TenantOnboardingRequest["unit"], "status"> & {
    status: WireUnitStatus;
  };
  tenancy?: { id: string; status: WireTenancy["status"] } | null;
};

const statuses: Record<WireOnboardingStatus, TenantOnboardingStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CONVERTED_TO_TENANCY: "converted_to_tenancy",
};
const frequencies: Record<WirePaymentFrequency, PaymentFrequency> = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  BIANNUAL: "biannual",
  YEARLY: "yearly",
};
const unitStatuses: Record<WireUnitStatus, UnitStatus> = {
  VACANT: "vacant",
  OCCUPIED: "occupied",
  PENDING_APPROVAL: "pending_approval",
  MAINTENANCE: "maintenance",
  INACTIVE: "inactive",
};

function normalizeRequest(request: WireRequest): TenantOnboardingRequest {
  return {
    ...request,
    status: statuses[request.status],
    paymentFrequency: frequencies[request.paymentFrequency],
    rentAmount: Number(request.rentAmount),
    unit: { ...request.unit, status: unitStatuses[request.unit.status] },
    tenancy: request.tenancy
      ? {
          id: request.tenancy.id,
          status: request.tenancy.status.toLowerCase() as Tenancy["status"],
        }
      : null,
  };
}

export async function createTenantOnboardingRequest(
  unitId: string,
  input: TenantOnboardingInput,
) {
  return normalizeRequest(
    await apiRequest<WireRequest>(
      `/units/${unitId}/tenant-onboarding-requests`,
      { method: "POST", body: JSON.stringify(input) },
    ),
  );
}

export async function createDirectTenant(
  unitId: string,
  input: TenantOnboardingInput,
) {
  return normalizeTenancy(
    await apiRequest<WireTenancy>(`/units/${unitId}/direct-tenant`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function getTenantOnboardingRequests() {
  const requests = await apiRequest<WireRequest[]>(
    "/tenant-onboarding-requests",
  );
  return requests.map(normalizeRequest);
}

export async function getTenantOnboardingRequest(id: string) {
  return normalizeRequest(
    await apiRequest<WireRequest>(`/tenant-onboarding-requests/${id}`),
  );
}

export async function approveTenantOnboardingRequest(id: string) {
  return normalizeTenancy(
    await apiRequest<WireTenancy>(
      `/tenant-onboarding-requests/${id}/approve`,
      { method: "POST" },
    ),
  );
}

export async function rejectTenantOnboardingRequest(
  id: string,
  reason?: string,
) {
  return normalizeRequest(
    await apiRequest<WireRequest>(`/tenant-onboarding-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
}
