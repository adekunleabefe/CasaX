import type { OperationalUser, UserRole } from "@casax/types";
import { apiRequest, logoutRequest } from "./api";

type WireRole = "ADMIN" | "LANDLORD" | "CARETAKER" | "APPLICANT" | "TENANT";
type AuthPayload = {
  user: Omit<OperationalUser, "role"> & { role: WireRole };
};
type RegistrationPayload = AuthPayload & {
  verificationEmailQueued: boolean;
};

const roles: Record<WireRole, UserRole> = {
  ADMIN: "admin",
  LANDLORD: "landlord",
  CARETAKER: "caretaker",
  APPLICANT: "applicant",
  TENANT: "tenant",
};

function normalizeUser(payload: AuthPayload): OperationalUser {
  return { ...payload.user, role: roles[payload.user.role] };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  firstName: string;
  lastName: string;
  role: "LANDLORD" | "APPLICANT";
}

export interface SetupAccountInput {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface SetupAccountInvitation {
  expiresAt: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
  confirmPassword: string;
}

export async function login(input: LoginInput) {
  return normalizeUser(
    await apiRequest<AuthPayload>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function logout() {
  await logoutRequest();
}

export async function register(input: RegisterInput) {
  const payload = await apiRequest<RegistrationPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return {
    user: normalizeUser(payload),
    verificationEmailQueued: payload.verificationEmailQueued,
  };
}

export async function setupAccount(input: SetupAccountInput) {
  return normalizeUser(
    await apiRequest<AuthPayload>("/auth/setup-account", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export function validateSetupAccountToken(token: string) {
  const query = new URLSearchParams({ token });
  return apiRequest<SetupAccountInvitation>(
    `/auth/setup-account/validate?${query.toString()}`,
  );
}

export function resendVerification(email: string) {
  return apiRequest<null>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyEmail(token: string) {
  return apiRequest<{ verified: boolean }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function requestPasswordReset(email: string) {
  return apiRequest<null>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: ResetPasswordInput) {
  return apiRequest<null>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function validatePasswordResetToken(token: string) {
  const query = new URLSearchParams({ token });
  return apiRequest<SetupAccountInvitation>(
    `/auth/reset-password/validate?${query.toString()}`,
  );
}
