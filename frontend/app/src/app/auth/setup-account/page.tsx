"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card } from "@casax/ui";
import { useSetupAccountInvitation } from "@/features/auth/queries";
import { setupAccountSchema } from "@/features/auth/schemas";
import { setupAccount } from "@/services/auth";

type SetupAccountValues = z.infer<typeof setupAccountSchema>;

export default function SetupAccountPage() {
  return (
    <Suspense fallback={<SetupSkeleton />}>
      <SetupAccountForm />
    </Suspense>
  );
}

function SetupAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string>();
  const invitation = useSetupAccountInvitation(token);
  const form = useForm<SetupAccountValues>({
    resolver: zodResolver(setupAccountSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  if (!token) {
    return <InvalidInvitation />;
  }

  if (invitation.isLoading) {
    return <SetupSkeleton />;
  }

  if (invitation.isError || !invitation.data) {
    return <InvalidInvitation message={invitation.error?.message} />;
  }

  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-emerald-700">CasaX access</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Set up your account
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Create a secure password to activate your CasaX workspace.
      </p>
      <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
        Secure link valid until{" "}
        {new Date(invitation.data.expiresAt).toLocaleString()}.
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          setError(undefined);
          try {
            await setupAccount(values);
            router.replace("/dashboard");
            router.refresh();
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "This invitation cannot be completed.",
            );
          }
        })}
      >
        <input type="hidden" {...form.register("token")} />
        <Field label="Create password" error={form.formState.errors.password?.message}>
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
          {form.formState.isSubmitting
            ? "Activating account..."
            : "Set password and continue"}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">
        Already activated?{" "}
        <Link className="font-medium text-emerald-700" href="/auth/login">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

function InvalidInvitation({ message }: { message?: string }) {
  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-orange-700">Invitation unavailable</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        This setup link is invalid
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        {message ?? "Ask CasaX to send a new account setup invitation."}
      </p>
      <Button className="mt-8 w-full" asChild>
        <Link href="/auth/login">Return to sign in</Link>
      </Button>
    </Card>
  );
}

function SetupSkeleton() {
  return (
    <Card className="p-9">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
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
