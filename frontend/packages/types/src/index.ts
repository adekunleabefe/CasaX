export type UserRole =
  | "admin"
  | "landlord"
  | "caretaker"
  | "applicant"
  | "tenant";

export type UnitStatus =
  | "vacant"
  | "occupied"
  | "pending_approval"
  | "maintenance"
  | "inactive";

export type ApplicationStatus =
  | "pending"
  | "inspection_booked"
  | "under_review"
  | "approved"
  | "rejected"
  | "converted_to_tenant";

export type TenancyStatus = "pending" | "active" | "expired" | "terminated";

export type PaymentFrequency = "monthly" | "quarterly" | "biannual" | "yearly";

export type TenantOnboardingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "converted_to_tenancy";

export type AgreementStatus =
  | "draft"
  | "generated"
  | "sent"
  | "signed"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "failed"
  | "cancelled";

export type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "pos"
  | "card"
  | "online_gateway";

export type RemittanceStatus =
  | "pending"
  | "partially_remitted"
  | "remitted"
  | "disputed"
  | "cancelled";

export interface NavigationItem {
  label: string;
  href: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  change?: string;
}

export type PropertyStatus = "active" | "inactive";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UnitOccupantSummary {
  id: string;
  email: string;
  profile?: ProfileSummary | null;
}

export interface UnitTenancySummary {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentFrequency: PaymentFrequency;
  status: TenancyStatus;
}

export interface UnitAgreementSummary {
  id: string;
  agreementNumber: string;
  status: AgreementStatus;
  generatedAt: string;
  signedAt?: string | null;
}

export interface UnitPaymentSummary {
  id: string;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  status: PaymentStatus;
}

export interface Unit {
  id: string;
  propertyId: string;
  name: string;
  rentAmount: number;
  bedroomCount: number;
  unitType: string;
  status: UnitStatus;
  isPubliclyVisible: boolean;
  createdAt: string;
  updatedAt: string;
  renewableTenancyId?: string;
  activeTenancy?: UnitTenancySummary | null;
  activeOccupant?: UnitOccupantSummary | null;
  agreementSummary?: UnitAgreementSummary | null;
  latestPaymentSummary?: UnitPaymentSummary | null;
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  type: string;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
  units?: Unit[];
  _count: { units: number };
}

export interface PropertyInput {
  name: string;
  address: string;
  city: string;
  state: string;
  type: string;
  status: PropertyStatus;
}

export interface UnitInput {
  name: string;
  rentAmount: number;
  bedroomCount: number;
  unitType: string;
  status: UnitStatus;
  isPubliclyVisible: boolean;
}

export interface PropertyList {
  items: Property[];
  pagination: Pagination;
}

export interface LandlordSummary {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  pendingApprovalUnits: number;
  maintenanceUnits: number;
  activeTenancies?: number;
  expiringSoonTenancies?: number;
  pendingConversions?: number;
}

export interface ProfileSummary {
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface OperationalUser {
  id?: string;
  email: string;
  role?: UserRole;
  profile?: ProfileSummary | null;
}

export interface Caretaker {
  id: string;
  user: OperationalUser;
}

export interface CaretakerAssignment {
  id: string;
  caretakerId: string;
  propertyId: string;
  assignedAt: string;
  endedAt?: string | null;
  caretaker: Caretaker;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state">;
}

export interface Applicant {
  id: string;
  user: OperationalUser;
}

export interface ApplicationHistory {
  id: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  note?: string | null;
  createdAt: string;
  reviewedBy: OperationalUser;
}

export interface Application {
  id: string;
  applicantId: string;
  propertyId: string;
  unitId: string;
  assignedCaretakerId?: string | null;
  notes?: string | null;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  applicant: Applicant;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state">;
  unit: Pick<
    Unit,
    "id" | "name" | "unitType" | "bedroomCount" | "rentAmount" | "status"
  >;
  assignedCaretaker?: Caretaker | null;
  createdBy: OperationalUser;
  approvalHistory: ApplicationHistory[];
}

export interface ApplicationInput {
  propertyId: string;
  unitId: string;
  assignedCaretakerId?: string;
  applicant: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  notes?: string;
}

export interface ApplicationUpdateInput {
  status?: Extract<
    ApplicationStatus,
    "pending" | "inspection_booked" | "under_review"
  >;
  notes?: string;
}

export interface ApplicationList {
  items: Application[];
  pagination: Pagination;
}

export interface ApplicationsSummary {
  totalApplications: number;
  newApplicants: number;
  pendingApprovals: number;
  approvedApplications: number;
  rejectedApplications: number;
  applicationsByCaretaker: {
    caretaker: Caretaker;
    totalApplications: number;
  }[];
}

export type AvailableApplicationProperty = Pick<
  Property,
  "id" | "name" | "address" | "city" | "state"
> & {
  units: Unit[];
};

export interface Tenancy {
  id: string;
  applicantId: string;
  vacancyApplicationId?: string | null;
  previousTenancyId?: string | null;
  landlordId: string;
  propertyId: string;
  unitId: string;
  userId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentFrequency: PaymentFrequency;
  status: TenancyStatus;
  notes?: string | null;
  terminatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: OperationalUser;
  applicant: Applicant;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state">;
  unit: Pick<Unit, "id" | "name" | "unitType" | "bedroomCount">;
  previousTenancy?: Pick<
    Tenancy,
    "id" | "startDate" | "endDate" | "status"
  > | null;
  invitationOutcome?:
    | "sent"
    | "email_missing"
    | "setup_complete"
    | "delivery_failed";
}

export interface TenancyInput {
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentFrequency: PaymentFrequency;
  notes?: string;
}

export interface TenantOnboardingInput extends TenancyInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface TenantOnboardingRequest {
  id: string;
  propertyId: string;
  unitId: string;
  landlordId: string;
  submittedByUserId: string;
  submittedByCaretakerId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentFrequency: PaymentFrequency;
  notes?: string | null;
  status: TenantOnboardingStatus;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state">;
  unit: Pick<Unit, "id" | "name" | "unitType" | "bedroomCount" | "status">;
  submittedByUser: OperationalUser;
  submittedByCaretaker?: Caretaker | null;
  reviewedBy?: OperationalUser | null;
  tenancy?: Pick<Tenancy, "id" | "status"> | null;
}

export interface TenancyAgreement {
  id: string;
  tenancyId: string;
  landlordId: string;
  tenantUserId: string;
  propertyId: string;
  unitId: string;
  title: string;
  agreementNumber: string;
  content: string;
  status: AgreementStatus;
  generatedAt: string;
  signedAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenancyAgreementInput {
  title?: string;
  content?: string;
}

export interface TenancyUpdateInput {
  endDate?: string;
  rentAmount?: number;
  paymentFrequency?: PaymentFrequency;
  notes?: string;
}

export interface TenancyList {
  items: Tenancy[];
  pagination: Pagination;
}

export interface OccupancyRecord {
  id: string;
  moveInDate: string;
  moveOutDate?: string | null;
  status: TenancyStatus;
  createdAt: string;
  tenancy: Tenancy;
  user: OperationalUser;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state">;
  unit: Pick<Unit, "id" | "name" | "unitType" | "bedroomCount">;
}

export interface OccupancyList {
  items: OccupancyRecord[];
  pagination: Pagination;
}

export interface OccupancySummary {
  activeTenancies: number;
  expiringSoonTenancies: number;
  pendingConversions: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  recentActivity: OccupancyRecord[];
}

export interface RentPayment {
  id: string;
  tenancyId: string;
  landlordId: string;
  propertyId: string;
  unitId: string;
  payerId: string;
  collectedByCaretakerId?: string | null;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  status: PaymentStatus;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  proofUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  payer: OperationalUser;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state">;
  unit: Pick<Unit, "id" | "name" | "unitType" | "bedroomCount">;
  tenancy: Pick<
    Tenancy,
    "id" | "startDate" | "endDate" | "status" | "paymentFrequency"
  >;
  collectedByCaretaker?: Caretaker | null;
}

export interface RentPaymentInput {
  tenancyId: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  proofUrl?: string;
  collectedByCaretakerId?: string;
}

export interface RentPaymentList {
  items: RentPayment[];
  pagination: Pagination;
}

export interface EligibleRentPayment extends RentPayment {
  unremittedAmount: number;
}

export interface RemittanceAllocation {
  id: string;
  amount: number;
  rentPayment: RentPayment;
}

export interface RemittanceRecord {
  id: string;
  landlordId: string;
  propertyId: string;
  caretakerId: string;
  amount: number;
  status: RemittanceStatus;
  method: PaymentMethod;
  remittedAt?: string | null;
  reference?: string | null;
  notes?: string | null;
  proofUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state">;
  caretaker: Caretaker;
  payments: RemittanceAllocation[];
}

export interface RemittanceInput {
  propertyId: string;
  caretakerId?: string;
  paymentIds: string[];
  amount: number;
  status: RemittanceStatus;
  method: PaymentMethod;
  remittedAt?: string;
  reference?: string;
  notes?: string;
  proofUrl?: string;
}

export interface RemittanceList {
  items: RemittanceRecord[];
  pagination: Pagination;
}

export interface PaymentSummary {
  totalExpectedRent: number;
  totalReceived: number;
  totalOverdue: number;
  totalPendingRemittance: number;
  totalRemitted: number;
  paymentCollectionRate: number;
  recentPayments: RentPayment[];
  recentRemittances: RemittanceRecord[];
}
