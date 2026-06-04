"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth" || pathname.startsWith("/auth/");

  if (isAuthPage) return <>{children}</>;

  return (
    <>
      <PublicHeader />
      {children}
      <PublicFooter />
    </>
  );
}
