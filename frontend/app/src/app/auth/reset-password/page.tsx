"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card } from "@casax/ui";
import { usePasswordResetInvitation } from "@/features/auth/queries";
import { resetPasswordSchema } from "@/features/auth/schemas";
import { resetPassword } from "@/services/auth";

type ResetValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const resetLink = usePasswordResetInvitation(token);
  const [error, setError] = useState<string>();
  const [completed, setCompleted] = useState(false);
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  if (!token || resetLink.isError || (!resetLink.isLoading && !resetLink.data)) {
    return <InvalidLink message={resetLink.error?.message} />;
  }
  if (resetLink.isLoading) return <LoadingCard />;
  if (completed) {
    return (
      <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
        <p className="text-sm font-medium text-emerald-700">Password updated</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Your password is ready
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Sign in with your new password to continue to your CasaX workspace.
        </p>
        <Button asChild className="mt-8 w-full">
          <Link href="/auth/login">Continue to sign in</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-emerald-700">Secure recovery</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Choose a new password
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Your link is valid. Choose a new password to secure your account.
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          setError(undefined);
          try {
            await resetPassword(values);
            setCompleted(true);
          } catch (caught) {
            setError(
              caught instanceof Error ? caught.message : "Unable to reset password.",
            );
          }
        })}
      >
        <input type="hidden" {...form.register("token")} />
        <Field label="New password" error={form.formState.errors.password?.message}>
          <input
            autoComplete="new-password"
            className={inputClass}
            type="password"
            {...form.register("password")}
          />
        </Field>
        <Field
          label="Confirm password"
          error={form.formState.errors.confirmPassword?.message}
        >
          <input
            autoComplete="new-password"
            className={inputClass}
            type="password"
            {...form.register("confirmPassword")}
          />
        </Field>
        {error ? (
          <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
            {error}
          </p>
        ) : null}
        <Button
          className="w-full"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting ? "Updating password..." : "Reset password"}
        </Button>
      </form>
    </Card>
  );
}

function InvalidLink({ message }: { message?: string }) {
  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-orange-700">Recovery unavailable</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        This reset link is invalid
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        {message ?? "Request a new password reset link to continue."}
      </p>
      <Button asChild className="mt-8 w-full">
        <Link href="/auth/forgot-password">Request another link</Link>
      </Button>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="p-9">
      <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
      <div className="mt-5 h-10 w-64 animate-pulse rounded bg-slate-100" />
      <div className="mt-8 h-12 animate-pulse rounded-xl bg-slate-100" />
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? (
        <span className="mt-2 block text-xs text-orange-700">{error}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
