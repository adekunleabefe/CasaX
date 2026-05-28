import { z } from "zod";

export const tenancyConversionSchema = z
  .object({
    startDate: z.string().min(1, "Select a lease start date."),
    endDate: z.string().min(1, "Select a lease end date."),
    rentAmount: z.coerce.number().min(0, "Rent cannot be negative."),
    paymentFrequency: z.enum(["monthly", "quarterly", "biannual", "yearly"]),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((values) => new Date(values.endDate) > new Date(values.startDate), {
    message: "End date must be after start date.",
    path: ["endDate"],
  });

export const terminationSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const tenancyUpdateSchema = z.object({
  endDate: z.string().min(1, "Select a lease end date."),
  rentAmount: z.number().min(0, "Rent cannot be negative."),
  paymentFrequency: z.enum(["monthly", "quarterly", "biannual", "yearly"]),
  notes: z.string().trim().max(2000).optional(),
});
