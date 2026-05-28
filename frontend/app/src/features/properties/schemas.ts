import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().trim().min(2, "Enter a property name.").max(120),
  address: z.string().trim().min(3, "Enter the property address.").max(255),
  city: z.string().trim().min(2, "Enter a city.").max(100),
  state: z.string().trim().min(2, "Enter a state.").max(100),
  type: z.string().trim().min(2, "Select or enter a property type.").max(100),
  status: z.enum(["active", "inactive"]),
});

export const unitSchema = z.object({
  name: z.string().trim().min(1, "Enter a unit name.").max(80),
  rentAmount: z.coerce.number().min(0, "Rent cannot be negative."),
  bedroomCount: z.coerce
    .number()
    .int("Bedrooms must be a whole number.")
    .min(0)
    .max(50),
  unitType: z.string().trim().min(2, "Enter a unit type.").max(80),
  status: z.enum([
    "vacant",
    "occupied",
    "pending_approval",
    "maintenance",
    "inactive",
  ]),
  isPubliclyVisible: z.coerce.boolean(),
});
