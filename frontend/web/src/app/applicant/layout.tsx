import type { ReactNode } from "react";
import { AccountShell } from "@/components/applicant/applicant-shell";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
