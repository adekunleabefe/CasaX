import type { Property } from "@casax/types";

export type PropertyLifecycleStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "live";

export const propertyLifecycleLabels: Record<PropertyLifecycleStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  live: "Live",
};

export function getPropertyLifecycleStatus(
  property: Pick<
    Property,
    "status" | "verificationStatus" | "listingStatus" | "_count"
  >,
): PropertyLifecycleStatus {
  if (property.status === "inactive" || property.listingStatus === "draft") {
    return "draft";
  }

  if (
    property.verificationStatus === "rejected" ||
    property.listingStatus === "rejected" ||
    property.listingStatus === "suspended"
  ) {
    return "changes_requested";
  }

  if (
    property.verificationStatus === "verified" &&
    property.listingStatus === "approved" &&
    property._count.units > 0
  ) {
    return "live";
  }

  if (property.verificationStatus === "verified") {
    return "approved";
  }

  if (
    property.verificationStatus === "pending" ||
    property.listingStatus === "pending_review"
  ) {
    return "under_review";
  }

  return "submitted";
}
