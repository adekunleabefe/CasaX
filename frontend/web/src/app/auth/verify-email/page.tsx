"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { ApplicantAuthShell } from "@/components/applicant-auth-shell";
import { verifyEmail } from "@/lib/auth";

export default function VerifyApplicantEmailPage() {
  return (
    <Suspense fallback={<VerificationLoading />}>
      <VerificationState />
    </Suspense>
  );
}

function VerificationState() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const next = safeNext(searchParams.get("next"));
  const signInHref = buildSignInHref(next);
  const verification = useQuery({
    queryKey: ["applicant", "verify-email", token],
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
    <AuthStateCard
      icon={<CheckCircle2 className="size-6" />}
      tone="success"
      eyebrow="Email verified"
      title="Your CasaX account is verified"
      description="You can now continue with your rental search, inspection booking, or application."
      action={
        next === "/rentals" ? (
          <Link href="/rentals">Browse rentals</Link>
        ) : (
          <Link href={signInHref}>Continue to CasaX</Link>
        )
      }
    />
  );
}

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/rentals";
}

function buildSignInHref(next: string) {
  const params = new URLSearchParams();
  if (next !== "/rentals") params.set("next", next);
  const query = params.toString();
  return query ? `/auth/sign-in?${query}` : "/auth/sign-in";
}

function InvalidVerification({ message }: { message?: string }) {
  return (
    <AuthStateCard
      icon={<CircleAlert className="size-6" />}
      tone="warning"
      eyebrow="Verification unavailable"
      title="This verification link is invalid"
      description={
        message ??
        "This link may have expired or already been used. Sign in or create a new CasaX account to continue."
      }
      action={<Link href="/auth/sign-in">Return to sign in</Link>}
    />
  );
}

function VerificationLoading() {
  return (
    <ApplicantAuthShell>
      <Card className="border-slate-200/80 bg-white p-7 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.38)] sm:p-9">
        <div className="mt-8 h-4 w-28 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 h-10 w-64 animate-pulse rounded bg-slate-100" />
        <div className="mt-8 h-12 animate-pulse rounded-xl bg-slate-100" />
      </Card>
    </ApplicantAuthShell>
  );
}

function AuthStateCard({
  action,
  description,
  eyebrow,
  icon,
  title,
  tone,
}: {
  action: ReactNode;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
  tone: "success" | "warning";
}) {
  const isSuccess = tone === "success";
  return (
    <ApplicantAuthShell>
      <Card className="border-slate-200/80 bg-white p-7 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.38)] sm:p-9">
        <div
          className={`flex size-12 items-center justify-center rounded-2xl ${
            isSuccess
              ? "bg-emerald-50 text-emerald-700"
              : "bg-orange-50 text-orange-700"
          }`}
        >
          {icon}
        </div>
        <p
          className={`mt-6 text-sm font-medium ${
            isSuccess ? "text-emerald-700" : "text-orange-700"
          }`}
        >
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
        <Button className="mt-8 w-full rounded-xl" asChild>
          {action}
        </Button>
      </Card>
    </ApplicantAuthShell>
  );
}
