import { z } from "zod";

export const caretakerAssignmentSchema = z.object({
  caretakerEmail: z.string().trim().email("Enter a valid caretaker email."),
});

export const applicationFormSchema = z.object({
  propertyId: z.string().uuid("Select a property."),
  unitId: z.string().uuid("Select a vacant unit."),
  applicant: z.object({
    firstName: z.string().trim().min(1, "Enter first name.").max(80),
    lastName: z.string().trim().min(1, "Enter last name.").max(80),
    email: z.string().trim().email("Enter a valid applicant email."),
    phone: z.string().trim().max(30).optional(),
  }),
  notes: z.string().trim().max(2000).optional(),
});

export const rejectionSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const applicationUpdateSchema = z.object({
  status: z.enum(["pending", "inspection_booked", "under_review"]),
  notes: z.string().trim().max(2000).optional(),
});
