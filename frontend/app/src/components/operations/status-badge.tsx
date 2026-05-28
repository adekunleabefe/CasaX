import type {
  ApplicationStatus,
  AgreementStatus,
  PaymentStatus,
  PropertyStatus,
  RemittanceStatus,
  TenantOnboardingStatus,
  TenancyStatus,
  UnitStatus,
} from "@casax/types";
import { cn } from "@casax/utils";

const labels: Record<
  | PropertyStatus
  | UnitStatus
  | ApplicationStatus
  | TenancyStatus
  | PaymentStatus
  | RemittanceStatus
  | TenantOnboardingStatus
  | AgreementStatus,
  string
> = {
  active: "Active",
  inactive: "Inactive",
  vacant: "Vacant",
  occupied: "Occupied",
  pending_approval: "Pending approval",
  maintenance: "Maintenance",
  pending: "Pending",
  inspection_booked: "Inspection booked",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  converted_to_tenant: "Converted to tenant",
  converted_to_tenancy: "Converted to tenancy",
  draft: "Draft",
  generated: "Generated",
  sent: "Sent",
  signed: "Signed",
  expired: "Expired",
  terminated: "Terminated",
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
    | AgreementStatus;
}) {
  const positive =
    status === "active" ||
    status === "occupied" ||
    status === "approved" ||
    status === "paid" ||
    status === "remitted" ||
    status === "signed";
  const warning =
    status === "pending_approval" ||
    status === "maintenance" ||
    status === "pending" ||
    status === "inspection_booked" ||
    status === "under_review" ||
    status === "partially_remitted" ||
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
          status === "converted_to_tenant" ||
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
