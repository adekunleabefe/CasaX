import { z } from "zod";

export const tenantOnboardingSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter the tenant's first name."),
    lastName: z.string().trim().min(1, "Enter the tenant's last name."),
    email: z.string().trim().email("Enter a valid email address.").or(z.literal("")),
    phone: z.string().trim().max(30).optional(),
    startDate: z.string().min(1, "Select a lease start date."),
    endDate: z.string().min(1, "Select a lease end date."),
    rentAmount: z.coerce.number().min(0, "Rent cannot be negative."),
    paymentFrequency: z.enum(["monthly", "quarterly", "biannual", "yearly"]),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((values) => Boolean(values.email || values.phone), {
    message: "Provide an email address or phone number.",
    path: ["email"],
  })
  .refine((values) => new Date(values.endDate) > new Date(values.startDate), {
    message: "End date must be after start date.",
    path: ["endDate"],
  });
