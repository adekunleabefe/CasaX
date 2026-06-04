import type { OperationalUser, UserRole } from "@casax/types";
import { apiRequest, logoutRequest } from "@/lib/api";

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
}

export function currentUser() {
  return apiRequest<Omit<OperationalUser, "role"> & { role: WireRole }>(
    "/auth/me",
    { skipAuthRecovery: true },
  ).then((user) => ({ ...user, role: roles[user.role] }) satisfies OperationalUser);
}

export function login(input: LoginInput) {
  return apiRequest<AuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  }).then(normalizeUser);
}

export function register(input: RegisterInput) {
  return apiRequest<RegistrationPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...input, role: "APPLICANT" }),
  }).then((payload) => ({
    user: normalizeUser(payload),
    verificationEmailQueued: payload.verificationEmailQueued,
  }));
}

export function verifyEmail(token: string) {
  return apiRequest<{ verified: boolean }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string) {
  return apiRequest<null>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuthRecovery: true,
  });
}

export function forgotPassword(email: string) {
  return apiRequest<{ emailQueued?: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuthRecovery: true,
  });
}

export async function logout() {
  await logoutRequest();
}
