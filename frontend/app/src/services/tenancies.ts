import type {
  OccupancyList,
  OccupancyRecord,
  OccupancySummary,
  PaymentFrequency,
  Tenancy,
  TenancyAgreement,
  TenancyAgreementInput,
  TenancyInput,
  TenancyList,
  TenancyStatus,
  TenancyUpdateInput,
} from "@casax/types";
import { apiRequest } from "./api";

type WireTenancyStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "TERMINATED";
type WirePaymentFrequency = "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "YEARLY";
export type WireTenancy = Omit<
  Tenancy,
  "status" | "paymentFrequency" | "rentAmount"
> & {
  status: WireTenancyStatus;
  paymentFrequency: WirePaymentFrequency;
  rentAmount: number | string;
};
type WireAgreementStatus =
  | "DRAFT"
  | "GENERATED"
  | "SENT"
  | "SIGNED"
  | "CANCELLED";
type WireAgreement = Omit<TenancyAgreement, "status"> & {
  status: WireAgreementStatus;
};
type WireOccupancy = Omit<OccupancyRecord, "status" | "tenancy"> & {
  status: WireTenancyStatus;
  tenancy: WireTenancy;
};

const tenancyStatuses: Record<WireTenancyStatus, TenancyStatus> = {
  PENDING: "pending",
  ACTIVE: "active",
  EXPIRED: "expired",
  TERMINATED: "terminated",
};
const frequencies: Record<WirePaymentFrequency, PaymentFrequency> = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  BIANNUAL: "biannual",
  YEARLY: "yearly",
};
const agreementStatuses = {
  DRAFT: "draft",
  GENERATED: "generated",
  SENT: "sent",
  SIGNED: "signed",
  CANCELLED: "cancelled",
} as const;

export function normalizeTenancy(tenancy: WireTenancy): Tenancy {
  return {
    ...tenancy,
    rentAmount: Number(tenancy.rentAmount),
    status: tenancyStatuses[tenancy.status],
    paymentFrequency: frequencies[tenancy.paymentFrequency],
  };
}

function normalizeAgreement(agreement: WireAgreement): TenancyAgreement {
  return { ...agreement, status: agreementStatuses[agreement.status] };
}

function normalizeOccupancy(record: WireOccupancy): OccupancyRecord {
  return {
    ...record,
    status: tenancyStatuses[record.status],
    tenancy: normalizeTenancy(record.tenancy),
  };
}

export async function convertApplicationToTenancy(
  applicationId: string,
  input: TenancyInput,
): Promise<Tenancy> {
  return normalizeTenancy(
    await apiRequest<WireTenancy>(
      `/applications/${applicationId}/convert-to-tenancy`,
      { method: "POST", body: JSON.stringify(input) },
    ),
  );
}

export async function getTenancies(status: TenancyStatus | "") {
  const query = new URLSearchParams({ page: "1", limit: "30" });
  if (status) query.set("status", status);
  const result = await apiRequest<{
    items: WireTenancy[];
    pagination: TenancyList["pagination"];
  }>(`/tenancies?${query.toString()}`);
  return { ...result, items: result.items.map(normalizeTenancy) };
}

export async function getTenancy(id: string): Promise<Tenancy> {
  return normalizeTenancy(await apiRequest<WireTenancy>(`/tenancies/${id}`));
}

export async function updateTenancy(
  id: string,
  input: TenancyUpdateInput,
): Promise<Tenancy> {
  return normalizeTenancy(
    await apiRequest<WireTenancy>(`/tenancies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function terminateTenancy(
  id: string,
  reason?: string,
): Promise<Tenancy> {
  return normalizeTenancy(
    await apiRequest<WireTenancy>(`/tenancies/${id}/terminate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
}

export async function renewTenancy(
  id: string,
  input: TenancyInput,
): Promise<Tenancy> {
  return normalizeTenancy(
    await apiRequest<WireTenancy>(`/tenancies/${id}/renew`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function getOccupancy(): Promise<OccupancyList> {
  const result = await apiRequest<{
    items: WireOccupancy[];
    pagination: OccupancyList["pagination"];
  }>("/occupancy?page=1&limit=30");
  return { ...result, items: result.items.map(normalizeOccupancy) };
}

export async function getUnitOccupancyHistory(
  unitId: string,
): Promise<OccupancyRecord[]> {
  const result = await apiRequest<WireOccupancy[]>(
    `/units/${unitId}/occupancy-history`,
  );
  return result.map(normalizeOccupancy);
}

export async function getOccupancySummary(): Promise<OccupancySummary> {
  const result = await apiRequest<
    Omit<OccupancySummary, "recentActivity"> & {
      recentActivity: WireOccupancy[];
    }
  >("/dashboard/occupancy-summary");
  return {
    ...result,
    recentActivity: result.recentActivity.map(normalizeOccupancy),
  };
}

export async function getTenancyAgreement(
  tenancyId: string,
): Promise<TenancyAgreement> {
  return normalizeAgreement(
    await apiRequest<WireAgreement>(`/tenancies/${tenancyId}/agreement`),
  );
}

export async function createTenancyAgreement(
  tenancyId: string,
  input: TenancyAgreementInput,
): Promise<TenancyAgreement> {
  return normalizeAgreement(
    await apiRequest<WireAgreement>(`/tenancies/${tenancyId}/agreement`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTenancyAgreement(
  id: string,
  input: TenancyAgreementInput,
): Promise<TenancyAgreement> {
  return normalizeAgreement(
    await apiRequest<WireAgreement>(`/agreements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function sendTenancyAgreement(id: string) {
  return normalizeAgreement(
    await apiRequest<WireAgreement>(`/agreements/${id}/send`, {
      method: "POST",
    }),
  );
}

export async function markTenancyAgreementSigned(id: string) {
  return normalizeAgreement(
    await apiRequest<WireAgreement>(`/agreements/${id}/mark-signed`, {
      method: "POST",
    }),
  );
}
