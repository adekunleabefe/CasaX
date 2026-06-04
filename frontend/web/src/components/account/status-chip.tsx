import type { ApplicationStatus } from "@casax/types";
import { cn } from "@casax/utils";
import type { ApplicantInspectionStatus } from "@/lib/applicant";

const applicationLabels: Record<ApplicationStatus, string> = {
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
};

const inspectionLabels: Record<ApplicantInspectionStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function ApplicationStatusChip({ status }: { status: ApplicationStatus }) {
  const positive = status === "approved";
  const muted =
    status === "rejected" ||
    status === "converted_to_resident" ||
    status === "converted_to_tenant";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        positive && "bg-emerald-50 text-emerald-700",
        muted && "bg-slate-100 text-slate-600",
        !positive && !muted && "bg-orange-50 text-orange-700",
      )}
    >
      {applicationLabels[status]}
    </span>
  );
}

export function InspectionStatusChip({
  status,
}: {
  status: ApplicantInspectionStatus;
}) {
  const tone: Record<ApplicantInspectionStatus, string> = {
    pending: "bg-orange-50 text-orange-700",
    confirmed: "bg-emerald-50 text-emerald-700",
    completed: "bg-slate-950 text-white",
    cancelled: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone[status]}`}
    >
      {inspectionLabels[status]}
    </span>
  );
}
