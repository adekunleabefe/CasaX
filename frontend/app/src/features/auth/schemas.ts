import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = loginSchema.extend({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  role: z.enum(["LANDLORD", "APPLICANT"]),
});

export const recoverySchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

export const setupAccountSchema = resetSchema.and(
  z.object({
    token: z.string().min(1, "This invitation link is invalid."),
  }),
);

export const resetPasswordSchema = resetSchema.and(
  z.object({
    token: z.string().min(1, "This password reset link is invalid."),
  }),
);
