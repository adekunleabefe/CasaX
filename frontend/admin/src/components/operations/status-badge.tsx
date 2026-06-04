import type {
  ApplicationStatus,
  AgreementStatus,
  LandlordRemittanceStatus,
  PaymentStatus,
  PropertyStatus,
  RemittanceStatus,
  TenantOnboardingStatus,
  TenancyStatus,
  UnitStatus,
} from "@casax/types";
import { cn } from "@casax/utils";
import {
  propertyLifecycleLabels,
  type PropertyLifecycleStatus,
} from "@/lib/property-lifecycle";

const labels: Record<
  | PropertyStatus
  | UnitStatus
  | ApplicationStatus
  | TenancyStatus
  | PaymentStatus
  | RemittanceStatus
  | TenantOnboardingStatus
  | AgreementStatus
  | LandlordRemittanceStatus
  | PropertyLifecycleStatus,
  string
> = {
  ...propertyLifecycleLabels,
  active: "Active",
  inactive: "Inactive",
  vacant: "Vacant",
  occupied: "Occupied",
  pending_approval: "Pending approval",
  maintenance: "Maintenance",
  pending: "Pending",
  submitted: "Submitted",
  inspection_required: "Inspection required",
  inspection_scheduled: "Inspection scheduled",
  inspection_booked: "Inspection booked",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  converted_to_tenant: "Converted to resident",
  converted_to_resident: "Converted to resident",
  converted_to_tenancy: "Converted to tenancy",
  draft: "Draft",
  generated: "Generated",
  sent: "Sent",
  signed: "Signed",
  expired: "Expired",
  terminated: "Terminated",
  processing: "Processing",
  paid: "Paid",
  overdue: "Overdue",
  failed: "Failed",
  cancelled: "Cancelled",
  partially_remitted: "Partially remitted",
  remitted: "Remitted",
  disputed: "Disputed",
};

export function StatusBadge({
  status,
}: {
  status:
    | PropertyStatus
    | UnitStatus
    | ApplicationStatus
    | TenancyStatus
    | PaymentStatus
    | RemittanceStatus
    | TenantOnboardingStatus
    | AgreementStatus
    | LandlordRemittanceStatus
    | PropertyLifecycleStatus;
}) {
  const positive =
    status === "active" ||
    status === "occupied" ||
    status === "approved" ||
    status === "live" ||
    status === "paid" ||
    status === "remitted" ||
    status === "signed";
  const warning =
    status === "submitted" ||
    status === "under_review" ||
    status === "inspection_required" ||
    status === "inspection_scheduled" ||
    status === "pending_approval" ||
    status === "maintenance" ||
    status === "pending" ||
    status === "inspection_booked" ||
    status === "partially_remitted" ||
    status === "processing" ||
    status === "draft" ||
    status === "generated" ||
    status === "sent";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        positive && "bg-emerald-50 text-emerald-700",
        status === "vacant" && "bg-sky-50 text-sky-700",
        warning && "bg-orange-50 text-orange-700",
        (status === "inactive" ||
          status === "rejected" ||
          status === "changes_requested" ||
          status === "converted_to_tenant" ||
          status === "converted_to_resident" ||
          status === "cancelled") &&
          "bg-slate-100 text-slate-600",
        (status === "expired" || status === "terminated" || status === "failed") &&
          "bg-slate-100 text-slate-600",
        (status === "overdue" || status === "disputed") &&
          "bg-orange-50 text-orange-700",
      )}
    >
      {labels[status]}
    </span>
  );
}
