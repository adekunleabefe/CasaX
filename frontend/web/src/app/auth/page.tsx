"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card } from "@casax/ui";
import { ApplicantAuthShell } from "@/components/applicant-auth-shell";
import {
  completeAuthContinuation,
  getContinuationFromQuery,
  saveContinuation,
} from "@/lib/auth-continuation";
import { login, register, resendVerification } from "@/lib/auth";
import { accountKeys } from "@/lib/applicant-queries";

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthShell />}>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">(
    pathname.endsWith("/sign-up") ? "register" : "login",
  );
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [registeredEmail, setRegisteredEmail] = useState<string>();
  const next = safeNext(searchParams.get("next"));
  const intent = searchParams.get("intent");
  const rentalSlug = searchParams.get("rentalSlug") ?? searchParams.get("rental");
  const vacancyListingId = searchParams.get("vacancyListingId");
  const signInHref = buildAuthHref("/auth/sign-in", next, intent);
  const continuation = getContinuationFromQuery({
    intent,
    next,
    rentalSlug,
    vacancyListingId,
  });

  useEffect(() => {
    saveContinuation(continuation);
  }, [continuation]);

  if (registeredEmail) {
    return (
      <AuthShell>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <MailCheck className="size-5" />
        </div>
        <p className="mt-6 text-sm font-medium text-emerald-700">
          CasaX account
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          We sent a verification link to{" "}
          <span className="font-semibold text-slate-950">{registeredEmail}</span>.
          Verify your CasaX account before continuing your rental journey.
        </p>
        {intent ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            After verification, you can continue with this rental.
          </p>
        ) : null}
        {notice ? (
          <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="mt-5 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
            {error}
          </p>
        ) : null}
        <div className="mt-7 grid gap-3">
          <Button className="w-full rounded-xl" asChild>
            <Link href={signInHref}>Return to sign in</Link>
          </Button>
          <Button
            className="w-full rounded-xl"
            onClick={async () => {
              setError(undefined);
              setNotice(undefined);
              try {
                await resendVerification(registeredEmail);
                setNotice("A fresh verification link has been prepared.");
              } catch (caught) {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : "Unable to resend verification right now.",
                );
              }
            }}
            type="button"
            variant="outline"
          >
            Resend verification email
          </Button>
          <Button className="w-full rounded-xl" variant="ghost" asChild>
            <Link href="/rentals">Back to rentals</Link>
          </Button>
        </div>
        <p className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          Account verification stays on CasaX.ng. Resident and landlord
          access remains separate in the operations portal.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <LockKeyhole className="size-5" />
      </div>
      <p className="mt-5 text-sm font-medium text-emerald-700">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {mode === "login"
          ? "Sign in to your CasaX account"
          : "Start your CasaX rental journey"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {mode === "login"
          ? "Continue your rental search, saved apartments, inspections, and applications."
          : "Save rentals, book inspections, and apply for verified apartments with less agent stress."}
      </p>
      {intent ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Sign in or create an account to continue this rental action.
        </p>
      ) : null}
      <form
        className="mt-6 space-y-3.5"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(undefined);
          setNotice(undefined);
          try {
            if (mode === "login") {
              const user = await login({
                email: String(form.get("email") ?? ""),
                password: String(form.get("password") ?? ""),
              });
              queryClient.setQueryData(accountKeys.me, user);
              const continuation = await completeAuthContinuation(next);
              router.replace(continuation.redirectTo);
              router.refresh();
              return;
            }

            const email = String(form.get("email") ?? "");
            await register({
              firstName: String(form.get("firstName") ?? ""),
              lastName: String(form.get("lastName") ?? ""),
              email,
              password: String(form.get("password") ?? ""),
            });
            setRegisteredEmail(email);
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Unable to continue securely.",
            );
          }
        }}
      >
        {mode === "register" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" name="firstName" required />
            <Field label="Last name" name="lastName" required />
          </div>
        ) : null}
        <Field label="Email address" name="email" required type="email" />
        {mode === "register" ? (
          <Field label="Phone number (optional)" name="phone" type="tel" />
        ) : null}
        <Field label="Password" name="password" required type="password" />
        {mode === "login" ? (
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                className="size-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-100"
                name="remember"
                type="checkbox"
              />
              Remember me
            </label>
            <Link
              className="font-medium text-emerald-700 hover:text-emerald-800"
              href="/auth/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        ) : null}
        <Button className="w-full rounded-xl" type="submit">
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {mode === "login" ? "New to CasaX?" : "Already have an account?"}{" "}
        <button
          className="font-semibold text-emerald-700 hover:text-emerald-800"
          onClick={() => {
            setError(undefined);
            setNotice(undefined);
            setMode((current) =>
              current === "login" ? "register" : "login",
            );
          }}
          type="button"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        CasaX protects applications and inspection requests through secure
        account access.
      </p>
    </AuthShell>
  );
}

function AuthShell({ children }: { children?: React.ReactNode }) {
  return (
    <ApplicantAuthShell>
      <Card className="border-slate-200/80 bg-white p-6 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.38)] sm:p-7">
        {children ?? (
          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-slate-100" />
        )}
      </Card>
    </ApplicantAuthShell>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/rentals";
}

function buildAuthHref(path: string, next: string, intent: string | null) {
  const params = new URLSearchParams();
  if (next !== "/rentals") params.set("next", next);
  if (intent) params.set("intent", intent);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
