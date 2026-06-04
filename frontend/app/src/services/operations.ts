import type {
  Application,
  ApplicationInput,
  ApplicationList,
  ApplicationsSummary,
  ApplicationStatus,
  ApplicationUpdateInput,
  AvailableApplicationProperty,
  CaretakerAssignment,
  CaretakerSummary,
  Unit,
  UnitStatus,
} from "@casax/types";
import { apiRequest } from "./api";

type WireApplicationStatus =
  | "PENDING"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_SCHEDULED"
  | "INSPECTION_BOOKED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED_TO_TENANT"
  | "CONVERTED_TO_RESIDENT";
type WireUnitStatus =
  | "VACANT"
  | "OCCUPIED"
  | "PENDING_APPROVAL"
  | "MAINTENANCE"
  | "INACTIVE";
type WireApplication = Omit<
  Application,
  "status" | "unit" | "approvalHistory"
> & {
  status: WireApplicationStatus;
  unit: Omit<Application["unit"], "rentAmount" | "status"> & {
    rentAmount: number | string;
    status: WireUnitStatus;
  };
  approvalHistory: (Omit<
    Application["approvalHistory"][number],
    "fromStatus" | "toStatus"
  > & {
    fromStatus: WireApplicationStatus;
    toStatus: WireApplicationStatus;
  })[];
};

const applicationStatus: Record<WireApplicationStatus, ApplicationStatus> = {
  PENDING: "pending",
  INSPECTION_REQUIRED: "inspection_required",
  INSPECTION_SCHEDULED: "inspection_scheduled",
  INSPECTION_BOOKED: "inspection_booked",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  CONVERTED_TO_TENANT: "converted_to_tenant",
  CONVERTED_TO_RESIDENT: "converted_to_resident",
};
const unitStatus = {
  VACANT: "vacant",
  OCCUPIED: "occupied",
  PENDING_APPROVAL: "pending_approval",
  MAINTENANCE: "maintenance",
  INACTIVE: "inactive",
} as const;

function normalizeUnit<
  T extends { rentAmount: number | string; status: WireUnitStatus },
>(
  unit: T,
): Omit<T, "rentAmount" | "status"> & {
  rentAmount: number;
  status: UnitStatus;
} {
  return {
    ...unit,
    rentAmount: Number(unit.rentAmount),
    status: unitStatus[unit.status],
  };
}

function normalizeApplication(application: WireApplication): Application {
  return {
    ...application,
    status: applicationStatus[application.status],
    unit: normalizeUnit(application.unit),
    approvalHistory: application.approvalHistory.map((event) => ({
      ...event,
      fromStatus: applicationStatus[event.fromStatus],
      toStatus: applicationStatus[event.toStatus],
    })),
  };
}

export function getCaretakerAssignments(): Promise<CaretakerAssignment[]> {
  return apiRequest<CaretakerAssignment[]>("/caretakers");
}

export function getPropertyCaretakers(
  propertyId: string,
): Promise<CaretakerAssignment[]> {
  return apiRequest<CaretakerAssignment[]>(
    `/properties/${propertyId}/caretakers`,
  );
}

export function assignCaretaker(propertyId: string, caretakerEmail: string) {
  return apiRequest<CaretakerAssignment>(
    `/properties/${propertyId}/caretakers`,
    {
      method: "POST",
      body: JSON.stringify({ caretakerEmail }),
    },
  );
}

export async function removeCaretaker(
  propertyId: string,
  caretakerId: string,
): Promise<void> {
  await apiRequest<null>(
    `/properties/${propertyId}/caretakers/${caretakerId}`,
    {
      method: "DELETE",
    },
  );
}

export async function getApplications(
  status?: ApplicationStatus | "",
): Promise<ApplicationList> {
  const query = new URLSearchParams({ page: "1", limit: "30" });
  if (status) query.set("status", status);
  const response = await apiRequest<{
    items: WireApplication[];
    pagination: ApplicationList["pagination"];
  }>(`/applications?${query.toString()}`);
  return {
    ...response,
    items: response.items.map(normalizeApplication),
  };
}

export async function getAvailableApplicationUnits(): Promise<
  AvailableApplicationProperty[]
> {
  const properties = await apiRequest<
    (Omit<AvailableApplicationProperty, "units"> & {
      units: (Omit<Unit, "rentAmount" | "status"> & {
        rentAmount: number | string;
        status: WireUnitStatus;
      })[];
    })[]
  >("/applications/available-units");
  return properties.map((property) => ({
    ...property,
    units: property.units.map(normalizeUnit),
  }));
}

export async function getApplication(id: string): Promise<Application> {
  return normalizeApplication(
    await apiRequest<WireApplication>(`/applications/${id}`),
  );
}

export async function createApplication(input: ApplicationInput) {
  return normalizeApplication(
    await apiRequest<WireApplication>("/applications", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function updateApplication(
  id: string,
  input: ApplicationUpdateInput,
) {
  return normalizeApplication(
    await apiRequest<WireApplication>(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function approveApplication(id: string) {
  return normalizeApplication(
    await apiRequest<WireApplication>(`/applications/${id}/approve`, {
      method: "POST",
    }),
  );
}

export async function rejectApplication(id: string, reason?: string) {
  return normalizeApplication(
    await apiRequest<WireApplication>(`/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
}

export async function getApplicationsSummary(): Promise<ApplicationsSummary> {
  return apiRequest<ApplicationsSummary>("/dashboard/applications-summary");
}

export async function getCaretakerSummary(): Promise<CaretakerSummary> {
  return apiRequest<CaretakerSummary>("/dashboard/caretaker-summary");
}
