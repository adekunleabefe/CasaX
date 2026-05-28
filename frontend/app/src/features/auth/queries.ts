"use client";

import { useQuery } from "@tanstack/react-query";
import type { OperationalUser, UserRole } from "@casax/types";
import { apiRequest } from "@/services/api";
import {
  validatePasswordResetToken,
  validateSetupAccountToken,
} from "@/services/auth";

type WireRole = "ADMIN" | "LANDLORD" | "CARETAKER" | "APPLICANT" | "TENANT";

const roles: Record<WireRole, UserRole> = {
  ADMIN: "admin",
  LANDLORD: "landlord",
  CARETAKER: "caretaker",
  APPLICANT: "applicant",
  TENANT: "tenant",
};

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await apiRequest<
        Omit<OperationalUser, "role"> & { role: WireRole }
      >("/auth/me");
      return { ...user, role: roles[user.role] } satisfies OperationalUser;
    },
    retry: false,
    refetchOnMount: "always",
    enabled,
  });
}

export function useSetupAccountInvitation(token: string) {
  return useQuery({
    queryKey: ["auth", "setup-account", token],
    queryFn: () => validateSetupAccountToken(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function usePasswordResetInvitation(token: string) {
  return useQuery({
    queryKey: ["auth", "reset-password", token],
    queryFn: () => validatePasswordResetToken(token),
    enabled: Boolean(token),
    retry: false,
  });
}
