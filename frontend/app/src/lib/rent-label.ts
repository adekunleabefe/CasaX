import type { PaymentFrequency } from "@casax/types";

export function rentAmountLabel(frequency?: PaymentFrequency | null) {
  if (frequency === "monthly") return "Monthly rent";
  if (frequency === "quarterly") return "Quarterly rent";
  if (frequency === "biannual") return "Biannual rent";
  if (frequency === "yearly") return "Annual rent";
  return "Rent amount";
}
