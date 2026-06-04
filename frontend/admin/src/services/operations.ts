import { apiFormRequest, apiRequest } from "./api";

export type AdminInspectionStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export type AdminApplicationStatus =
  | "submitted"
  | "under_review"
  | "inspection_required"
  | "inspection_scheduled"
  | "approved"
  | "rejected"
  | "converted_to_resident";

export interface InviteLandlordInput {
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
}

export interface LandlordInvitation {
  id: string;
  email: string;
  expiresAt: string;
  landlordId: string;
  userId: string;
  emailQueued: boolean;
}

export function inviteLandlord(input: InviteLandlordInput) {
  return apiRequest<LandlordInvitation>("/admin/landlords/invitations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface AdminDashboardSummary {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  activeResidents: number;
  pendingRemittancesAmount: number;
  rentCollected: number;
  leaseRenewalsDue: number;
  liveRentalListings: number;
  pendingInspections: number;
  applicationsInReview: number;
  pendingResidentOnboarding: number;
  completedRemittancesAmount: number;
  failedRemittancesCount: number;
}

export function getAdminDashboardSummary() {
  return apiRequest<AdminDashboardSummary>("/admin/dashboard/summary");
}

export type AdminPropertyVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type AdminPropertyListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";
export type AdminUnitStatus =
  | "VACANT"
  | "OCCUPIED"
  | "PENDING_APPROVAL"
  | "MAINTENANCE"
  | "INACTIVE";
export type AdminUnitReadinessStatus = "INCOMPLETE" | "READY";
export type AdminVacancyStatus =
  | "PRIVATE"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "FILLED";

export interface AdminProfile {
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface AdminLandlordSummary {
  id: string;
  businessName?: string | null;
  status?: "ACTIVE" | "INVITED";
  propertyCount?: number;
  unitCount?: number;
  createdAt?: string;
  updatedAt?: string;
  latestInvitation?: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
    expiresAt: string;
    acceptedAt?: string | null;
    createdAt: string;
  } | null;
  user: {
    id: string;
    email: string;
    isActive?: boolean;
    emailVerifiedAt?: string | null;
    createdAt?: string;
    profile?: AdminProfile | null;
  };
}

export interface AdminPropertySetupInput {
  landlordId: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  description?: string;
  ownershipType?: string;
  numberOfUnits?: number;
  unitMix?: {
    unitType: string;
    quantity: number;
    annualRent: number;
    prefix?: string;
  }[];
  status?: "active" | "inactive";
}

export interface AdminUnitSetupInput {
  name: string;
  unitType: string;
  bedroomCount: number;
  bathroomCount?: number;
  rentAmount: number;
  serviceCharge?: number;
  depositAmount?: number;
  listingTitle?: string;
  publicDescription?: string;
  photos?: string[];
  amenities?: string[];
  availabilityDate?: string;
  inspectionNotes?: string;
  readinessStatus?: AdminUnitReadinessStatus;
  occupancyStatus?: "vacant" | "occupied" | "reserved";
  status?: "vacant" | "occupied" | "pending_approval" | "maintenance" | "inactive";
}

export interface AdminPropertyAssetInput {
  title: string;
  url?: string;
  note?: string;
}

export interface AdminVacancyListing {
  id: string;
  unitId: string;
  landlordId: string;
  title: string;
  description?: string | null;
  status: AdminVacancyStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  unit?: AdminUnit & {
    property: AdminPropertyReview;
    applications?: { id: string; status: string }[];
    inspectionBookings?: { id: string; status: string; scheduledAt: string }[];
  };
}

export interface AdminUnitImage {
  id: string;
  unitId: string;
  imageUrl: string;
  storageKey?: string | null;
  caption?: string | null;
  category?: string | null;
  sortOrder: number;
  isCover: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVacancyReadyUnit extends AdminUnit {
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    type: string;
    landlordId: string;
    landlord: AdminLandlordSummary;
  };
}

export interface AdminInspectionRecord {
  id: string;
  applicantId: string;
  vacancyListingId: string;
  vacancyApplicationId?: string | null;
  scheduledAt: string;
  status: AdminInspectionStatus;
  casaXOfficer?: string | null;
  applicant: {
    id: string;
    user: {
      id: string;
      email: string;
      profile?: AdminProfile | null;
    };
  };
  rental: {
    propertyName: string;
    unitName: string;
    location: string;
    annualRent: number;
  };
  vacancyApplication?: {
    id: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminApplicationRecord {
  id: string;
  status: AdminApplicationStatus;
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  applicant: {
    id: string;
    user: {
      id: string;
      email: string;
      profile?: AdminProfile | null;
    };
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  unit: {
    id: string;
    name: string;
    unitType: string;
    rentAmount: number;
  };
  vacancyListing?: {
    id: string;
    title: string;
    status: string;
  } | null;
  inspectionBookings: {
    id: string;
    status: AdminInspectionStatus;
    scheduledAt: string;
  }[];
  approvalHistory: {
    id: string;
    fromStatus: AdminApplicationStatus;
    toStatus: AdminApplicationStatus;
    note?: string | null;
    createdAt: string;
    reviewedBy: {
      email: string;
      profile?: AdminProfile | null;
    };
  }[];
}

export interface AdminUnit {
  id: string;
  propertyId: string;
  name: string;
  rentAmount: string | number;
  bedroomCount: number;
  bathroomCount: number;
  unitType: string;
  listingTitle?: string | null;
  publicDescription?: string | null;
  photos?: string[] | null;
  amenities: string[];
  serviceCharge?: string | number | null;
  depositAmount?: string | number | null;
  availabilityDate?: string | null;
  inspectionNotes?: string | null;
  readinessStatus: AdminUnitReadinessStatus;
  status: AdminUnitStatus;
  isPubliclyVisible: boolean;
  images?: AdminUnitImage[];
  createdAt: string;
  updatedAt: string;
  vacancyListings?: AdminVacancyListing[];
  tenancies?: {
    id: string;
    status: string;
    endDate: string;
    user: { email: string; profile?: AdminProfile | null };
  }[];
}

export interface AdminActivity {
  id: string;
  action: string;
  metadata?: unknown;
  createdAt: string;
}

export interface AdminPropertyReview {
  id: string;
  landlordId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  type: string;
  status: "ACTIVE" | "INACTIVE";
  verificationStatus: AdminPropertyVerificationStatus;
  listingStatus: AdminPropertyListingStatus;
  createdAt: string;
  updatedAt: string;
  landlord: AdminLandlordSummary;
  units: AdminUnit[];
  activity?: AdminActivity[];
  _count: { units: number };
}

export interface ReviewNoteInput {
  note?: string;
}

export interface AdminUpdateUnitInput {
  name?: string;
  rentAmount?: number;
  bedroomCount?: number;
  bathroomCount?: number;
  unitType?: string;
  listingTitle?: string;
  publicDescription?: string;
  photos?: string[];
  amenities?: string[];
  serviceCharge?: number;
  depositAmount?: number;
  availabilityDate?: string;
  inspectionNotes?: string;
  readinessStatus?: AdminUnitReadinessStatus;
  status?: "vacant" | "occupied" | "pending_approval" | "maintenance" | "inactive";
}

export interface AdminUpdateVacancyInput {
  title?: string;
  description?: string;
  status?: AdminVacancyStatus;
}

export interface AdminResidentOnboardingInput {
  unitId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  moveInDate: string;
  leaseStartDate: string;
  leaseEndDate: string;
  paymentFrequency: "monthly" | "quarterly" | "biannual" | "yearly";
  sendInvite?: boolean;
}

export interface AdminApprovedApplicantOnboardingInput {
  moveInDate: string;
  leaseStartDate: string;
  leaseEndDate: string;
  paymentFrequency: "monthly" | "quarterly" | "biannual" | "yearly";
  sendInvite?: boolean;
}

export interface AdminResidentOnboardingSummary {
  approvedApplicantsAwaitingOnboarding: number;
  availableUnits: number;
  activeResidents: number;
  expiringLeases: number;
}

export interface AdminAvailableResidentUnit {
  id: string;
  propertyId: string;
  landlordId: string;
  name: string;
  unitType: string;
  bedroomCount: number;
  annualRent: number;
  serviceCharge?: number | null;
  status: AdminUnitStatus;
  property: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  landlord: {
    id: string;
    businessName?: string | null;
    user: {
      email: string;
      profile?: AdminProfile | null;
    };
  };
}

export interface AdminResidentRecord {
  id: string;
  resident: {
    id: string;
    email: string;
    profile?: AdminProfile | null;
  };
  property: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  unit: {
    id: string;
    name: string;
    unitType: string;
    rentAmount: number;
  };
  annualRent: number;
  leaseStart: string;
  leaseEnd: string;
  status: string;
  agreement?: {
    id: string;
    status: string;
    agreementNumber: string;
  } | null;
  createdAt: string;
}

export interface AdminResidentDetail {
  id: string;
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    profile?: AdminProfile | null;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  unit: {
    id: string;
    name: string;
    unitType: string;
    bedroomCount: number;
    rentAmount: number;
  };
  rentAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  paymentFrequency: string;
  agreement?: {
    id: string;
    status: string;
    agreementNumber: string;
  } | null;
  rentPayments: {
    id: string;
    amount: number;
    dueDate: string;
    status: string;
  }[];
}

export function getPropertyReviews() {
  return apiRequest<AdminPropertyReview[]>("/admin/properties/reviews");
}

export function getAdminLandlords() {
  return apiRequest<AdminLandlordSummary[]>("/admin/landlords");
}

export function getAdminProperties() {
  return apiRequest<AdminPropertyReview[]>("/admin/properties");
}

export function getAdminProperty(id: string) {
  return apiRequest<AdminPropertyReview>(`/admin/properties/${id}`);
}

export function createAdminProperty(input: AdminPropertySetupInput) {
  return apiRequest<AdminPropertyReview>("/admin/properties", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminProperty(
  id: string,
  input: Partial<AdminPropertySetupInput>,
) {
  return apiRequest<AdminPropertyReview>(`/admin/properties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminProperty(id: string) {
  return apiRequest<{ id: string }>(`/admin/properties/${id}`, {
    method: "DELETE",
  });
}

export function submitAdminPropertyForReview(
  id: string,
  input: ReviewNoteInput = {},
) {
  return apiRequest<AdminPropertyReview>(`/admin/properties/${id}/submit-review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPropertyReview(id: string) {
  return apiRequest<AdminPropertyReview>(`/admin/properties/reviews/${id}`);
}

export function startPropertyReview(id: string, input: ReviewNoteInput = {}) {
  return apiRequest<AdminPropertyReview>(`/admin/properties/${id}/start-review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function requestPropertyChanges(id: string, input: ReviewNoteInput = {}) {
  return apiRequest<AdminPropertyReview>(
    `/admin/properties/${id}/request-changes`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function approvePropertyReview(id: string, input: ReviewNoteInput = {}) {
  return apiRequest<AdminPropertyReview>(`/admin/properties/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function rejectPropertyReview(id: string, input: ReviewNoteInput = {}) {
  return apiRequest<AdminPropertyReview>(`/admin/properties/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAdminPropertyUnits(id: string) {
  return apiRequest<AdminUnit[]>(`/admin/properties/${id}/units`);
}

export function getAdminUnit(id: string) {
  return apiRequest<AdminUnit & { property: AdminPropertyReview }>(
    `/admin/units/${id}`,
  );
}

export function createAdminUnit(propertyId: string, input: AdminUnitSetupInput) {
  return apiRequest<AdminUnit>(`/admin/properties/${propertyId}/units`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminUnit(id: string, input: AdminUpdateUnitInput) {
  return apiRequest<AdminUnit>(`/admin/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function markAdminUnitReady(id: string) {
  return apiRequest<AdminUnit>(`/admin/units/${id}/mark-ready`, {
    method: "POST",
  });
}

export function getAdminUnitImages(id: string) {
  return apiRequest<AdminUnitImage[]>(`/admin/units/${id}/images`);
}

export function uploadAdminUnitImage(
  unitId: string,
  input: {
    file: File;
    caption?: string;
    category?: string;
    sortOrder?: number;
    isCover?: boolean;
  },
) {
  const form = new FormData();
  form.append("image", input.file);
  if (input.caption) form.append("caption", input.caption);
  if (input.category) form.append("category", input.category);
  if (input.sortOrder !== undefined) {
    form.append("sortOrder", String(input.sortOrder));
  }
  if (input.isCover !== undefined) {
    form.append("isCover", String(input.isCover));
  }
  return apiFormRequest<AdminUnitImage>(`/admin/units/${unitId}/images`, form);
}

export function updateAdminUnitImage(
  imageId: string,
  input: {
    caption?: string;
    category?: string;
    sortOrder?: number;
    isCover?: boolean;
  },
) {
  return apiRequest<AdminUnitImage>(`/admin/unit-images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminUnitImage(imageId: string) {
  return apiRequest<{ id: string }>(`/admin/unit-images/${imageId}`, {
    method: "DELETE",
  });
}

export function deleteAdminUnit(id: string) {
  return apiRequest<{ id: string }>(`/admin/units/${id}`, {
    method: "DELETE",
  });
}

export function createAdminPropertyPhoto(
  propertyId: string,
  input: AdminPropertyAssetInput,
) {
  return apiRequest<unknown>(`/admin/properties/${propertyId}/photos`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createAdminPropertyDocument(
  propertyId: string,
  input: AdminPropertyAssetInput,
) {
  return apiRequest<unknown>(`/admin/properties/${propertyId}/documents`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyAdminUnit(id: string, input: ReviewNoteInput = {}) {
  return apiRequest<AdminUnit>(`/admin/units/${id}/verify`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function requestAdminUnitChanges(
  id: string,
  input: ReviewNoteInput = {},
) {
  return apiRequest<AdminUnit>(`/admin/units/${id}/request-changes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAdminVacancies(status?: AdminVacancyStatus) {
  const query = status ? `?status=${status}` : "";
  return apiRequest<AdminVacancyListing[]>(`/admin/vacancies${query}`);
}

export function getAdminVacancyReadyUnits() {
  return apiRequest<AdminVacancyReadyUnit[]>("/admin/vacancies/ready-units");
}

export function publishAdminVacancy(
  unitId: string,
  input: AdminUpdateVacancyInput = {},
) {
  return apiRequest<AdminVacancyListing>(`/admin/units/${unitId}/publish-vacancy`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function prepareAdminVacancy(
  unitId: string,
  input: AdminUpdateVacancyInput = {},
) {
  return apiRequest<AdminVacancyListing>(`/admin/units/${unitId}/prepare-vacancy`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function publishAdminVacancyListing(
  id: string,
  input: AdminUpdateVacancyInput = {},
) {
  return apiRequest<AdminVacancyListing>(`/admin/vacancies/${id}/publish`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function unpublishAdminVacancy(id: string, input: ReviewNoteInput = {}) {
  return apiRequest<AdminVacancyListing>(`/admin/vacancies/${id}/unpublish`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function archiveAdminVacancy(id: string, input: ReviewNoteInput = {}) {
  return apiRequest<AdminVacancyListing>(`/admin/vacancies/${id}/archive`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function restoreAdminVacancyDraft(
  id: string,
  input: ReviewNoteInput = {},
) {
  return apiRequest<AdminVacancyListing>(
    `/admin/vacancies/${id}/restore-draft`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateAdminVacancy(id: string, input: AdminUpdateVacancyInput) {
  return apiRequest<AdminVacancyListing>(`/admin/vacancies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export interface AdminUpdateInspectionInput {
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledAt?: string;
  note?: string;
}

export interface AdminUpdateApplicationInput {
  status:
    | "under_review"
    | "inspection_required"
    | "inspection_scheduled"
    | "approved"
    | "rejected";
  note?: string;
}

export function getAdminInspections() {
  return apiRequest<AdminInspectionRecord[]>("/admin/inspections");
}

export function updateAdminInspection(
  id: string,
  input: AdminUpdateInspectionInput,
) {
  return apiRequest<AdminInspectionRecord>(`/admin/inspections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getAdminApplications() {
  return apiRequest<AdminApplicationRecord[]>("/admin/applications");
}

export function updateAdminApplication(
  id: string,
  input: AdminUpdateApplicationInput,
) {
  return apiRequest<AdminApplicationRecord>(`/admin/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function onboardExistingResident(input: AdminResidentOnboardingInput) {
  return apiRequest("/admin/residents/onboard-existing", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function onboardApprovedApplicant(
  id: string,
  input: AdminApprovedApplicantOnboardingInput,
) {
  return apiRequest(`/admin/residents/convert-applicant/${id}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAdminResidentOnboardingSummary() {
  return apiRequest<AdminResidentOnboardingSummary>(
    "/admin/residents/onboarding-summary",
  );
}

export function getAdminAvailableResidentUnits() {
  return apiRequest<AdminAvailableResidentUnit[]>(
    "/admin/residents/available-units",
  );
}

export function getAdminResidents() {
  return apiRequest<AdminResidentRecord[]>("/admin/residents");
}

export function getAdminResident(id: string) {
  return apiRequest<AdminResidentDetail>(`/admin/residents/${id}`);
}
