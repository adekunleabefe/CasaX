import type {
  LandlordSummary,
  Property,
  PropertyInput,
  PropertyList,
  PropertyStatus,
  Unit,
  UnitAgreementSummary,
  UnitInput,
  UnitPaymentSummary,
  UnitStatus,
  UnitTenancySummary,
} from "@casax/types";
import { apiRequest } from "./api";

type WirePropertyStatus = "ACTIVE" | "INACTIVE";
type WireUnitStatus =
  | "VACANT"
  | "OCCUPIED"
  | "PENDING_APPROVAL"
  | "MAINTENANCE"
  | "INACTIVE";
type WireTenancyStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "TERMINATED";
type WirePaymentFrequency = "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "YEARLY";
type WireAgreementStatus =
  | "DRAFT"
  | "GENERATED"
  | "SENT"
  | "SIGNED"
  | "CANCELLED";
type WirePaymentStatus =
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "FAILED"
  | "CANCELLED";

type WireUnit = Omit<
  Unit,
  | "rentAmount"
  | "status"
  | "activeTenancy"
  | "agreementSummary"
  | "latestPaymentSummary"
> & {
  rentAmount: number | string;
  status: WireUnitStatus;
  activeTenancy?:
    | (Omit<
        UnitTenancySummary,
        "rentAmount" | "paymentFrequency" | "status"
      > & {
        rentAmount: number | string;
        paymentFrequency: WirePaymentFrequency;
        status: WireTenancyStatus;
      })
    | null;
  agreementSummary?:
    | (Omit<UnitAgreementSummary, "status"> & {
        status: WireAgreementStatus;
      })
    | null;
  latestPaymentSummary?:
    | (Omit<UnitPaymentSummary, "amount" | "status"> & {
        amount: number | string;
        status: WirePaymentStatus;
      })
    | null;
};
type WireProperty = Omit<Property, "status" | "units"> & {
  status: WirePropertyStatus;
  units?: WireUnit[];
};

const propertyStatus: Record<WirePropertyStatus, PropertyStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};
const unitStatus: Record<WireUnitStatus, UnitStatus> = {
  VACANT: "vacant",
  OCCUPIED: "occupied",
  PENDING_APPROVAL: "pending_approval",
  MAINTENANCE: "maintenance",
  INACTIVE: "inactive",
};
const tenancyStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  EXPIRED: "expired",
  TERMINATED: "terminated",
} as const;
const paymentFrequency = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  BIANNUAL: "biannual",
  YEARLY: "yearly",
} as const;
const agreementStatus = {
  DRAFT: "draft",
  GENERATED: "generated",
  SENT: "sent",
  SIGNED: "signed",
  CANCELLED: "cancelled",
} as const;
const paymentStatus = {
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

function normalizeUnit(unit: WireUnit): Unit {
  const activeTenancy = unit.activeTenancy
    ? {
        ...unit.activeTenancy,
        rentAmount: Number(unit.activeTenancy.rentAmount),
        status: tenancyStatus[unit.activeTenancy.status],
        paymentFrequency: paymentFrequency[unit.activeTenancy.paymentFrequency],
      }
    : null;
  return {
    ...unit,
    rentAmount: Number(unit.rentAmount),
    status: unitStatus[unit.status],
    activeTenancy,
    agreementSummary: unit.agreementSummary
      ? {
          ...unit.agreementSummary,
          status: agreementStatus[unit.agreementSummary.status],
        }
      : null,
    latestPaymentSummary: unit.latestPaymentSummary
      ? {
          ...unit.latestPaymentSummary,
          amount: Number(unit.latestPaymentSummary.amount),
          status: paymentStatus[unit.latestPaymentSummary.status],
        }
      : null,
    renewableTenancyId:
      activeTenancy?.status === "active" || activeTenancy?.status === "expired"
        ? activeTenancy.id
        : undefined,
  };
}

function normalizeProperty(property: WireProperty): Property {
  return {
    ...property,
    status: propertyStatus[property.status],
    units: property.units?.map(normalizeUnit),
  };
}

export async function getLandlordSummary(): Promise<LandlordSummary> {
  return apiRequest<LandlordSummary>("/dashboard/landlord-summary");
}

export async function getProperties(search = ""): Promise<PropertyList> {
  const query = new URLSearchParams({ page: "1", limit: "24" });
  if (search.trim()) query.set("search", search.trim());
  const result = await apiRequest<{
    items: WireProperty[];
    pagination: PropertyList["pagination"];
  }>(`/properties?${query.toString()}`);
  return { ...result, items: result.items.map(normalizeProperty) };
}

export async function getProperty(id: string): Promise<Property> {
  const property = await apiRequest<WireProperty>(`/properties/${id}`);
  return normalizeProperty(property);
}

export async function getPropertyUnits(propertyId: string): Promise<Unit[]> {
  const units = await apiRequest<WireUnit[]>(`/properties/${propertyId}/units`);
  return units.map(normalizeUnit);
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  return normalizeProperty(
    await apiRequest<WireProperty>("/properties", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function updateProperty(
  id: string,
  input: PropertyInput,
): Promise<Property> {
  return normalizeProperty(
    await apiRequest<WireProperty>(`/properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteProperty(id: string): Promise<void> {
  await apiRequest<null>(`/properties/${id}`, { method: "DELETE" });
}

export async function createUnit(
  propertyId: string,
  input: UnitInput,
): Promise<Unit> {
  return normalizeUnit(
    await apiRequest<WireUnit>(`/properties/${propertyId}/units`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function getUnit(id: string): Promise<Unit> {
  return normalizeUnit(await apiRequest<WireUnit>(`/units/${id}`));
}

export async function updateUnit(id: string, input: UnitInput): Promise<Unit> {
  return normalizeUnit(
    await apiRequest<WireUnit>(`/units/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteUnit(id: string): Promise<void> {
  await apiRequest<null>(`/units/${id}`, { method: "DELETE" });
}
