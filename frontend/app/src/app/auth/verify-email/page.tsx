"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card } from "@casax/ui";
import { verifyEmail } from "@/services/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerificationLoading />}>
      <VerificationState />
    </Suspense>
  );
}

function VerificationState() {
  const token = useSearchParams().get("token") ?? "";
  const verification = useQuery({
    queryKey: ["auth", "verify-email", token],
    queryFn: () => verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) return <InvalidVerification />;
  if (verification.isLoading) return <VerificationLoading />;
  if (verification.isError) {
    return <InvalidVerification message={verification.error.message} />;
  }

  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-emerald-700">Email verified</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Your email is confirmed
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Your CasaX account email has been securely verified.
      </p>
      <Button asChild className="mt-8 w-full">
        <Link href="/auth/login">Continue to sign in</Link>
      </Button>
    </Card>
  );
}

function InvalidVerification({ message }: { message?: string }) {
  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-orange-700">Verification unavailable</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        This verification link is invalid
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        {message ?? "Request a new verification link from your account flow."}
      </p>
      <Button asChild className="mt-8 w-full">
        <Link href="/auth/login">Return to sign in</Link>
      </Button>
    </Card>
  );
}

function VerificationLoading() {
  return (
    <Card className="p-9">
      <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
      <div className="mt-5 h-10 w-64 animate-pulse rounded bg-slate-100" />
      <div className="mt-8 h-12 animate-pulse rounded-xl bg-slate-100" />
    </Card>
  );
}
