import type { ApplicationStatus } from "@casax/types";
import { apiRequest } from "@/lib/api";

export type ApplicantInspectionStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface ApplicantRentalSummary {
  id: string;
  vacancyListingId: string;
  propertyId: string;
  unitId: string;
  propertyName: string;
  unitName: string;
  title: string;
  location: string;
  address: string;
  city: string;
  state: string;
  annualRent: number;
  unitType: string;
  bedrooms: number;
  vacancyStatus: string;
}

export interface SavedRentalRecord {
  id: string;
  vacancyListingId: string;
  savedAt: string;
  rental: ApplicantRentalSummary;
}

export interface InspectionBookingRecord {
  id: string;
  vacancyListingId: string;
  unitId: string;
  applicationId?: string | null;
  scheduledAt: string;
  status: ApplicantInspectionStatus;
  casaXOfficer?: string | null;
  rental: ApplicantRentalSummary;
  application?: { id: string; status: ApplicationStatus } | null;
  createdAt: string;
  updatedAt: string;
}

type WireRentalSummary = Omit<ApplicantRentalSummary, "annualRent"> & {
  annualRent: number | string;
};
type WireSavedRental = Omit<SavedRentalRecord, "rental"> & {
  rental: WireRentalSummary;
};
type WireInspection = Omit<InspectionBookingRecord, "rental"> & {
  rental: WireRentalSummary;
};

function normalizeRental(rental: WireRentalSummary): ApplicantRentalSummary {
  return { ...rental, annualRent: Number(rental.annualRent) };
}

function normalizeSavedRental(record: WireSavedRental): SavedRentalRecord {
  return { ...record, rental: normalizeRental(record.rental) };
}

function normalizeInspection(record: WireInspection): InspectionBookingRecord {
  return { ...record, rental: normalizeRental(record.rental) };
}

export async function getSavedRentals() {
  const records = await apiRequest<WireSavedRental[]>("/applicant/saved-rentals");
  return records.map(normalizeSavedRental);
}

export function saveRental(vacancyListingId: string) {
  return apiRequest<WireSavedRental>("/applicant/saved-rentals", {
    method: "POST",
    body: JSON.stringify({ vacancyListingId }),
  }).then(normalizeSavedRental);
}

export async function removeSavedRental(id: string) {
  await apiRequest<null>(`/applicant/saved-rentals/${id}`, {
    method: "DELETE",
  });
}

export async function getInspectionBookings() {
  const records = await apiRequest<WireInspection[]>("/applicant/inspections");
  return records.map(normalizeInspection);
}

export function createInspectionBooking(input: {
  vacancyListingId: string;
  scheduledAt?: string;
  note?: string;
}) {
  return apiRequest<WireInspection>("/applicant/inspections", {
    method: "POST",
    body: JSON.stringify(input),
  }).then(normalizeInspection);
}

export function cancelInspectionBooking(id: string) {
  return apiRequest<WireInspection>(
    `/applicant/inspections/${id}/cancel`,
    { method: "PATCH" },
  ).then(normalizeInspection);
}
