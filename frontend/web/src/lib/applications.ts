import type {
  Application,
  ApplicationList,
  ApplicationStatus,
  UnitStatus,
} from "@casax/types";
import { apiRequest } from "@/lib/api";

export interface PublicApplicationInput {
  propertyId: string;
  unitId: string;
  vacancyListingId?: string;
  notes?: string;
}

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

const unitStatus: Record<WireUnitStatus, UnitStatus> = {
  VACANT: "vacant",
  OCCUPIED: "occupied",
  PENDING_APPROVAL: "pending_approval",
  MAINTENANCE: "maintenance",
  INACTIVE: "inactive",
};

function normalizeApplication(application: WireApplication): Application {
  return {
    ...application,
    status: applicationStatus[application.status],
    unit: {
      ...application.unit,
      rentAmount: Number(application.unit.rentAmount),
      status: unitStatus[application.unit.status],
    },
    approvalHistory: application.approvalHistory.map((event) => ({
      ...event,
      fromStatus: applicationStatus[event.fromStatus],
      toStatus: applicationStatus[event.toStatus],
    })),
  };
}

export async function getApplications(): Promise<ApplicationList> {
  const response = await apiRequest<{
    items: WireApplication[];
    pagination: ApplicationList["pagination"];
  }>("/applications?page=1&limit=30");
  return {
    ...response,
    items: response.items.map(normalizeApplication),
  };
}

export function getApplication(id: string) {
  return apiRequest<WireApplication>(`/applications/${id}`).then(
    normalizeApplication,
  );
}

export function createApplication(input: PublicApplicationInput) {
  return apiRequest<WireApplication>("/applications", {
    method: "POST",
    body: JSON.stringify(input),
  }).then(normalizeApplication);
}
