import { z } from "zod";

export const paymentSchema = z.object({
  tenancyId: z.string().uuid("Select a tenancy."),
  amount: z.number().positive("Enter a payment amount."),
  dueDate: z.string().min(1, "Select a due date."),
  paidAt: z.string().optional(),
  status: z.enum([
    "pending",
    "processing",
    "paid",
    "overdue",
    "failed",
    "cancelled",
  ]),
  method: z.enum(["bank_transfer", "cash", "pos", "card", "online_gateway"]),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  proofUrl: z.union([z.literal(""), z.string().url("Enter a valid URL.")]).optional(),
  collectedByCaretakerId: z.union([z.literal(""), z.string().uuid()]).optional(),
});

export const paymentEditSchema = paymentSchema
  .omit({ tenancyId: true, collectedByCaretakerId: true })
  .partial();

export const remittanceSchema = z.object({
  propertyId: z.string().uuid("Select at least one payment."),
  caretakerId: z.string().uuid("Select caretaker-collected payments."),
  paymentIds: z.array(z.string().uuid()).min(1, "Select at least one payment."),
  amount: z.number().positive("Enter the amount remitted."),
  status: z.enum([
    "pending",
    "partially_remitted",
    "remitted",
    "disputed",
    "cancelled",
  ]),
  method: z.enum(["bank_transfer", "cash", "pos", "card", "online_gateway"]),
  remittedAt: z.string().optional(),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  proofUrl: z.union([z.literal(""), z.string().url("Enter a valid URL.")]).optional(),
});
