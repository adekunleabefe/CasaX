import type { OperationalUser, UserRole } from "@casax/types";
import { apiRequest, logoutRequest } from "./api";

type WireRole = "ADMIN" | "LANDLORD" | "CARETAKER" | "APPLICANT" | "TENANT";

const roles: Record<WireRole, UserRole> = {
  ADMIN: "admin",
  LANDLORD: "landlord",
  CARETAKER: "caretaker",
  APPLICANT: "applicant",
  TENANT: "tenant",
};

export async function getCurrentUser() {
  const user = await apiRequest<
    Omit<OperationalUser, "role"> & { role: WireRole }
  >("/auth/me");
  return { ...user, role: roles[user.role] } satisfies OperationalUser;
}

export async function logout() {
  await logoutRequest();
}
